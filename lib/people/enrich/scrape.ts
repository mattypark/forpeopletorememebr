import "server-only";

/**
 * Fetches a user-pasted URL server-side and extracts readable content for the
 * research agent. Login-walled sites (LinkedIn, Instagram) usually yield only
 * public meta tags — that's expected and handled gracefully.
 */

export interface PageContent {
  url: string;
  title: string;
  description: string;
  text: string;
  ok: boolean;
  note?: string;
}

const MAX_TEXT = 6000;
const TIMEOUT_MS = 10000;

// SSRF guard: refuse anything that isn't a public http(s) host.
function isPublicHttpUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local")) return false;

  // Block obvious private / link-local / loopback IP literals.
  const blocked = [
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^169\.254\./, // includes cloud metadata 169.254.169.254
    /^172\.(1[6-9]|2\d|3[0-1])\./,
    /^0\./,
    /^::1$/,
    /^fe80:/i,
    /^fc00:/i,
  ];
  return !blocked.some((re) => re.test(host));
}

function metaContent(html: string, patterns: RegExp[]): string {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)<>"']+/gi) ?? [];
  return [...new Set(matches.map((u) => u.replace(/[.,;]+$/, "")))];
}

export async function fetchPage(url: string): Promise<PageContent> {
  const base: PageContent = {
    url,
    title: "",
    description: "",
    text: "",
    ok: false,
  };

  if (!isPublicHttpUrl(url)) {
    return { ...base, note: "blocked (not a public URL)" };
  }

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!resp.ok) {
      return { ...base, note: `could not access (HTTP ${resp.status})` };
    }

    const html = await resp.text();
    const title = metaContent(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ]);
    const description = metaContent(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    ]);

    return {
      url,
      title,
      description,
      text: stripHtml(html).slice(0, MAX_TEXT),
      ok: true,
    };
  } catch {
    return { ...base, note: "could not access (timeout or login-walled)" };
  }
}
