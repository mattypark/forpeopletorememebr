import { detectLink } from "./links";
import type { Person } from "./types";

/**
 * Network views shown in the sidebar. `platform` matches the label returned by
 * detectLink() so filtering stays in one place.
 */
export interface PlatformDef {
  slug: string;
  label: string;
  platform: string;
}

export const PLATFORMS: PlatformDef[] = [
  { slug: "github", label: "GitHub", platform: "GitHub" },
  { slug: "linkedin", label: "LinkedIn", platform: "LinkedIn" },
  { slug: "x", label: "X", platform: "X" },
  { slug: "instagram", label: "Instagram", platform: "Instagram" },
];

export function platformBySlug(slug: string): PlatformDef | undefined {
  return PLATFORMS.find((p) => p.slug === slug);
}

/** A person belongs to a network if any of their links resolves to it. */
export function hasPlatform(person: Person, platform: string): boolean {
  return person.links.some((url) => detectLink(url).platform === platform);
}

export function filterByPlatform(people: Person[], platform: string): Person[] {
  return people.filter((p) => hasPlatform(p, platform));
}

/** Count of people per platform, for sidebar badges. */
export function platformCounts(people: Person[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const def of PLATFORMS) {
    counts[def.slug] = people.filter((p) => hasPlatform(p, def.platform)).length;
  }
  return counts;
}
