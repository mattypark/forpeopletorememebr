import { notFound } from "next/navigation";

import { getPeople } from "@/lib/people/queries";
import {
  platformBySlug,
  filterByPlatform,
  PLATFORMS,
} from "@/lib/people/platforms";
import { platformLink } from "@/lib/people/social-stats";
import type { SocialStats } from "@/lib/people/types";
import { NetworkCard } from "@/components/people/network-card";
import { RefreshStatsButton } from "@/components/people/refresh-stats-button";

export function generateStaticParams() {
  return PLATFORMS.map((p) => ({ platform: p.slug }));
}

export default async function NetworkPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform } = await params;
  const def = platformBySlug(platform);
  if (!def) notFound();

  const statsKey = def.slug as keyof SocialStats;
  const people = await getPeople();
  const filtered = filterByPlatform(people, def.platform);

  const canCount = def.slug !== "linkedin";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            {def.label}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length}{" "}
            {filtered.length === 1 ? "person" : "people"} with a {def.label}{" "}
            profile
            {canCount ? " — refresh to pull follower counts." : "."}
          </p>
        </div>
        <RefreshStatsButton personIds={filtered.map((p) => p.id)} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No one with a {def.label} link yet. Add a {def.label} URL to a person
          and they&apos;ll show up here.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((person) => {
            const link = platformLink(person, statsKey);
            if (!link) return null;
            return (
              <NetworkCard
                key={person.id}
                person={person}
                profileUrl={link.url}
                handle={link.handle}
                stats={person.socialStats[statsKey]}
                platformLabel={def.label}
              />
            );
          })}
        </div>
      )}

      {def.slug === "linkedin" && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          LinkedIn blocks follower counts behind a login — cards show the
          direct profile link instead.
        </p>
      )}
    </div>
  );
}
