import "server-only";

/**
 * Deterministic enrichment from the public GitHub API — real profile URLs and
 * facts, never guessed. Unauthenticated works for personal use (60 req/h);
 * set GITHUB_TOKEN to raise the limit.
 */

export interface GithubFacts {
  htmlUrl: string;
  name: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  blog: string | null;
  twitterUsername: string | null;
}

const API = "https://api.github.com";

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "rolodex-enrich",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

interface GithubUser {
  login: string;
  html_url: string;
  name: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  blog: string | null;
  twitter_username: string | null;
}

/** Pull the GitHub login out of a github.com URL, if present. */
export function loginFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)github\.com$/.test(u.hostname.replace(/^www\./, ""))) return null;
    const seg = u.pathname.split("/").filter(Boolean)[0];
    return seg ?? null;
  } catch {
    return null;
  }
}

async function getUser(login: string): Promise<GithubFacts | null> {
  try {
    const resp = await fetch(`${API}/users/${encodeURIComponent(login)}`, {
      headers: headers(),
    });
    if (!resp.ok) return null;
    const u = (await resp.json()) as GithubUser;
    return {
      htmlUrl: u.html_url,
      name: u.name,
      company: u.company,
      location: u.location,
      bio: u.bio,
      blog: u.blog ? u.blog : null,
      twitterUsername: u.twitter_username,
    };
  } catch {
    return null;
  }
}

async function searchTopUser(name: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`${name} in:name`);
    const resp = await fetch(`${API}/search/users?q=${q}&per_page=1`, {
      headers: headers(),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { items?: Array<{ login: string }> };
    return data.items?.[0]?.login ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolves GitHub facts: prefer an explicit github link, otherwise search by
 * name. Returns null when nothing confident is found.
 */
export async function fetchGithubFacts(
  name: string,
  existingLinks: string[],
): Promise<GithubFacts | null> {
  const explicit = existingLinks.map(loginFromUrl).find(Boolean);
  const login = explicit ?? (name.trim() ? await searchTopUser(name.trim()) : null);
  if (!login) return null;
  return getUser(login);
}
