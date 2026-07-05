import "server-only";

/**
 * Client for the Scrapling sidecar (scraper/main.py). The sidecar searches
 * DuckDuckGo for a person's public profiles and scrapes them with anti-bot
 * fetching — much deeper than meta-tag fetches. Optional: everything degrades
 * gracefully when SCRAPER_URL is unset or the service is down.
 *
 * Run it with: cd scraper && ./run.sh   (then set SCRAPER_URL=http://127.0.0.1:8787)
 */

export interface ScrapedPage {
  url: string;
  title: string;
  description: string;
  text: string;
  ok: boolean;
  note: string;
}

export interface ScrapePersonResult {
  candidates: string[];
  pages: ScrapedPage[];
}

const SCRAPE_TIMEOUT_MS = 90_000; // stealth browser fetches are slow

function scraperUrl(): string | null {
  const url = process.env.SCRAPER_URL?.trim();
  return url ? url.replace(/\/$/, "") : null;
}

export function scraperConfigured(): boolean {
  return scraperUrl() !== null;
}

async function post<T>(path: string, body: unknown): Promise<T | null> {
  const base = scraperUrl();
  if (!base) return null;
  try {
    const resp = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(SCRAPE_TIMEOUT_MS),
    });
    if (!resp.ok) return null;
    return (await resp.json()) as T;
  } catch {
    return null; // sidecar down — caller falls back to Gemini-only research
  }
}

/** Search the web for a person's public profiles and scrape the top hits. */
export async function scrapePerson(
  name: string,
  hints: string[],
): Promise<ScrapePersonResult | null> {
  if (!name.trim()) return null;
  return post<ScrapePersonResult>("/person", {
    name: name.trim(),
    hints: hints.filter(Boolean).slice(0, 6),
    max_pages: 4,
  });
}

/** Scrape specific URLs (e.g. profile links the user pasted). */
export async function scrapeUrls(urls: string[]): Promise<ScrapedPage[]> {
  if (urls.length === 0) return [];
  const res = await post<{ pages: ScrapedPage[] }>("/fetch", {
    urls: urls.slice(0, 5),
  });
  return res?.pages ?? [];
}
