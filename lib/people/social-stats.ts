import "server-only";

import { detectLink } from "./links";
import { scrapeUrls } from "./enrich/scraper-client";
import type { Person, SocialPlatformStats, SocialStats } from "./types";

/**
 * Best-effort follower/content stats per platform.
 * - GitHub: public REST API (reliable, no scraping).
 * - Instagram / X: og:description meta via the Scrapling sidecar when
 *   SCRAPER_URL is configured (Instagram embeds "N Followers" there; X gives
 *   the bio, which we surface as "posts about").
 * - LinkedIn: authwalled — link + username only, no counts.
 */

const PLATFORM_KEYS = ["github", "x", "instagram", "linkedin"] as const;
type PlatformKey = (typeof PLATFORM_KEYS)[number];

const PLATFORM_LABEL: Record<PlatformKey, string> = {
  github: "GitHub",
  x: "X",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

/** First link on the person that belongs to the platform. */
export function platformLink(
  person: Person,
  key: PlatformKey,
): { url: string; handle: string } | null {
  for (const url of person.links) {
    const det = detectLink(url);
    if (det.platform === PLATFORM_LABEL[key] && det.safe) {
      return { url, handle: det.handle };
    }
  }
  return null;
}

/** "12.5K" / "1,234" / "2.1m" → number. */
function parseCount(raw: string): number | null {
  const cleaned = raw.trim().replace(/,/g, "");
  const match = cleaned.match(/^([\d.]+)\s*([km])?$/i);
  if (!match) return null;
  const base = Number.parseFloat(match[1]);
  if (!Number.isFinite(base)) return null;
  const suffix = match[2]?.toLowerCase();
  if (suffix === "k") return Math.round(base * 1_000);
  if (suffix === "m") return Math.round(base * 1_000_000);
  return Math.round(base);
}

async function githubStats(username: string, url: string): Promise<SocialPlatformStats | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "bery-personal-crm",
    };
    const token = process.env.GITHUB_TOKEN?.trim();
    if (token) headers.Authorization = `Bearer ${token}`;

    const resp = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { followers?: number; bio?: string | null };

    return {
      username,
      profileUrl: url,
      followers: typeof data.followers === "number" ? data.followers : null,
      posts: data.bio?.trim() || null,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function scrapedStats(
  key: "x" | "instagram",
  username: string,
  url: string,
): Promise<SocialPlatformStats | null> {
  const pages = await scrapeUrls([url]);
  const page = pages[0];
  if (!page) return null;

  // Instagram og:description: "1,234 Followers, 56 Following, 78 Posts - …";
  // X sometimes exposes the same pattern, otherwise just the bio.
  const description = page.description || "";
  const followerMatch = description.match(/([\d.,]+\s*[KMkm]?)\s+Followers/i);
  const followers = followerMatch ? parseCount(followerMatch[1]) : null;

  // Bio / description doubles as a "what they post" signal.
  const posts =
    key === "instagram"
      ? description.replace(/^[\d.,KMkm\s]+Followers.*?Posts\s*[-–—]\s*/i, "").trim() || null
      : description.trim() || null;

  if (!followers && !posts && !page.ok) return null;

  return {
    username,
    profileUrl: url,
    followers,
    posts: posts ? posts.slice(0, 300) : null,
    fetchedAt: new Date().toISOString(),
  };
}

/** Fetch fresh stats for every platform this person has a link for. */
export async function buildSocialStats(person: Person): Promise<SocialStats> {
  const stats: SocialStats = { ...person.socialStats };

  const jobs = PLATFORM_KEYS.map(async (key) => {
    const link = platformLink(person, key);
    if (!link) {
      delete stats[key];
      return;
    }

    if (key === "github") {
      const fresh = await githubStats(link.handle, link.url);
      if (fresh) stats.github = fresh;
      return;
    }

    if (key === "linkedin") {
      stats.linkedin = {
        username: link.handle,
        profileUrl: link.url,
        followers: null,
        posts: null,
        fetchedAt: new Date().toISOString(),
      };
      return;
    }

    const fresh = await scrapedStats(key, link.handle, link.url);
    if (fresh) {
      stats[key] = fresh;
    } else if (!stats[key]) {
      // Keep at least the link so the UI can render username + URL.
      stats[key] = {
        username: link.handle,
        profileUrl: link.url,
        followers: null,
        posts: null,
        fetchedAt: new Date().toISOString(),
      };
    }
  });

  await Promise.all(jobs);
  return stats;
}
