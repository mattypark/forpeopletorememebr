/**
 * Detects the platform of a social/web URL by hostname so the UI can show a
 * label and a stable handle. Pure + side-effect free — safe in any component.
 */
export interface DetectedLink {
  url: string;
  platform: string;
  handle: string;
  safe: boolean;
}

const HOST_MAP: Array<{ match: RegExp; platform: string }> = [
  { match: /github\.com$/, platform: "GitHub" },
  { match: /(twitter\.com|x\.com)$/, platform: "X" },
  { match: /linkedin\.com$/, platform: "LinkedIn" },
  { match: /instagram\.com$/, platform: "Instagram" },
  { match: /(youtube\.com|youtu\.be)$/, platform: "YouTube" },
  { match: /tiktok\.com$/, platform: "TikTok" },
  { match: /threads\.(net|com)$/, platform: "Threads" },
  { match: /bsky\.app$/, platform: "Bluesky" },
  { match: /t\.me$/, platform: "Telegram" },
  { match: /(facebook\.com|fb\.com)$/, platform: "Facebook" },
  { match: /substack\.com$/, platform: "Substack" },
  { match: /medium\.com$/, platform: "Medium" },
  { match: /dribbble\.com$/, platform: "Dribbble" },
  { match: /behance\.net$/, platform: "Behance" },
];

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export function detectLink(raw: string): DetectedLink {
  try {
    const url = new URL(raw);
    const safe = SAFE_PROTOCOLS.has(url.protocol);
    const host = url.hostname.replace(/^www\./, "");

    const entry = HOST_MAP.find((h) => h.match.test(host));
    const platform = entry?.platform ?? host;

    const segments = url.pathname.split("/").filter(Boolean);
    const handle = segments.length > 0 ? segments[0] : host;

    return { url: raw, platform, handle, safe };
  } catch {
    return { url: raw, platform: "Link", handle: raw, safe: false };
  }
}

/** Validates + normalizes a pasted URL, adding https:// when the scheme is missing. */
export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!SAFE_PROTOCOLS.has(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
