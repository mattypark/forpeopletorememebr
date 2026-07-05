"""Bery scraper sidecar — Scrapling-powered person lookup.

Endpoints:
  GET  /health            liveness probe
  POST /person            search DuckDuckGo for a person's public profiles
                          (LinkedIn / Instagram / GitHub / X), scrape the top
                          hits, return page content for the LLM to extract from
  POST /fetch             scrape a specific list of URLs

Runs locally next to the Next.js app; Bery talks to it via SCRAPER_URL.
Scrapling: https://github.com/mattypark/Scrapling
"""

from __future__ import annotations

import re
import urllib.parse

from fastapi import FastAPI
from pydantic import BaseModel, Field

from scrapling.fetchers import Fetcher

try:  # StealthyFetcher needs camoufox — optional, used when plain fetch is blocked
    from scrapling.fetchers import StealthyFetcher

    HAS_STEALTH = True
except Exception:  # pragma: no cover
    HAS_STEALTH = False

app = FastAPI(title="Bery scraper", version="0.1.0")

MAX_TEXT = 6000
FETCH_TIMEOUT = 20
SEARCH_TIMEOUT = 15
BLOCKED_STATUSES = {403, 429, 999}  # 999 = LinkedIn's bot rejection

# Only profile-shaped URLs on these hosts come back from /person searches.
PROFILE_PATTERNS = [
    re.compile(r"^https?://([a-z]+\.)?linkedin\.com/in/[^/?#]+", re.I),
    re.compile(r"^https?://(www\.)?instagram\.com/[A-Za-z0-9._]+/?$", re.I),
    re.compile(r"^https?://(www\.)?github\.com/[A-Za-z0-9-]+/?$", re.I),
    re.compile(r"^https?://(www\.)?(x|twitter)\.com/[A-Za-z0-9_]+/?$", re.I),
]

PRIVATE_HOST = re.compile(
    r"^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1)"
)


class PersonRequest(BaseModel):
    name: str
    hints: list[str] = Field(default_factory=list)
    max_pages: int = 4


class FetchRequest(BaseModel):
    urls: list[str]


class PageContent(BaseModel):
    url: str
    title: str = ""
    description: str = ""
    text: str = ""
    ok: bool = False
    note: str = ""


def is_public_http(url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(url)
    except ValueError:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    return not PRIVATE_HOST.match(parsed.hostname or "")


def is_profile_url(url: str) -> bool:
    return any(p.match(url) for p in PROFILE_PATTERNS)


def resolve_ddg_link(href: str) -> str:
    """DuckDuckGo HTML results wrap targets in /l/?uddg=<encoded> redirects."""
    if "uddg=" in href:
        query = urllib.parse.urlparse(href).query
        target = urllib.parse.parse_qs(query).get("uddg", [""])[0]
        return urllib.parse.unquote(target)
    return href


# Search engines tried in order — DDG rate-limits bursts with HTTP 202.
SEARCH_ENGINES = [
    ("https://html.duckduckgo.com/html/?q={q}", "a.result__a::attr(href)"),
    ("https://lite.duckduckgo.com/lite/?q={q}", "a.result-link::attr(href), td a::attr(href)"),
    ("https://www.bing.com/search?q={q}", "li.b_algo h2 a::attr(href)"),
]


def web_search(query: str, max_links: int = 8) -> list[str]:
    quoted = urllib.parse.quote(query)
    for url_tpl, selector in SEARCH_ENGINES:
        try:
            page = Fetcher.get(
                url_tpl.format(q=quoted), timeout=SEARCH_TIMEOUT, stealthy_headers=True
            )
        except Exception:
            continue
        if page.status != 200:
            continue
        links: list[str] = []
        for href in page.css(selector):
            target = resolve_ddg_link(str(href))
            if target.startswith("http") and target not in links:
                links.append(target)
            if len(links) >= max_links:
                break
        if links:
            return links
    return []


def looks_authwalled(text: str) -> bool:
    lowered = text[:2000].lower()
    return any(
        marker in lowered
        for marker in ("sign in", "join now", "authwall", "log in to continue")
    ) and len(text) < 1200


def scrape_page(url: str) -> PageContent:
    if not is_public_http(url):
        return PageContent(url=url, note="blocked (not a public URL)")

    page = None
    try:
        page = Fetcher.get(url, timeout=FETCH_TIMEOUT, stealthy_headers=True)
    except Exception as exc:
        page = None
        note = f"fetch failed: {type(exc).__name__}"
    else:
        note = ""

    text = page.get_all_text(ignore_tags=("script", "style")) if page is not None else ""

    needs_stealth = page is None or page.status in BLOCKED_STATUSES or looks_authwalled(text)
    if needs_stealth and HAS_STEALTH:
        try:
            page = StealthyFetcher.fetch(url, headless=True, network_idle=True)
            text = page.get_all_text(ignore_tags=("script", "style"))
            note = "via stealth browser"
        except Exception as exc:
            if page is None:
                return PageContent(url=url, note=f"stealth failed: {type(exc).__name__}")

    if page is None:
        return PageContent(url=url, note=note or "could not fetch")

    def meta(selector: str) -> str:
        found = page.css(selector).extract_first()
        return str(found).strip() if found else ""

    title = meta('meta[property="og:title"]::attr(content)') or meta("title::text")
    description = meta('meta[property="og:description"]::attr(content)') or meta(
        'meta[name="description"]::attr(content)'
    )

    # Authwall pages (LinkedIn sign-up, Instagram login) carry no person data —
    # flag them so the LLM never ingests the boilerplate as facts.
    wall_markers = ("sign up | linkedin", "log in", "login • instagram", "authwall")
    if any(m in title.lower() for m in wall_markers):
        return PageContent(url=url, title=title, note="authwalled (login required)")

    cleaned = re.sub(r"\s+", " ", text).strip()[:MAX_TEXT]
    ok = bool(title or description or len(cleaned) > 200)
    return PageContent(
        url=url,
        title=title,
        description=description,
        text=cleaned,
        ok=ok,
        note=note if ok else (note or "page yielded no usable content"),
    )


@app.get("/health")
def health() -> dict:
    return {"ok": True, "stealth": HAS_STEALTH}


@app.post("/person")
def person(req: PersonRequest) -> dict:
    name = req.name.strip()
    if not name:
        return {"candidates": [], "pages": []}

    hint_str = " ".join(h.strip() for h in req.hints if h.strip())[:120]
    queries = [
        f'site:linkedin.com/in "{name}" {hint_str}',
        f'site:github.com "{name}" {hint_str}',
        f'site:instagram.com "{name}" {hint_str}',
        f'"{name}" {hint_str} linkedin',
    ]

    candidates: list[str] = []
    for query in queries:
        if len(candidates) >= 6:  # enough — avoid tripping rate limits
            break
        for link in web_search(query):
            if is_profile_url(link) and link not in candidates:
                candidates.append(link)

    pages = [scrape_page(url) for url in candidates[: max(1, min(req.max_pages, 8))]]
    return {
        "candidates": candidates,
        "pages": [p.model_dump() for p in pages],
    }


@app.post("/fetch")
def fetch(req: FetchRequest) -> dict:
    pages = [scrape_page(url) for url in req.urls[:5]]
    return {"pages": [p.model_dump() for p in pages]}
