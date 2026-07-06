import Link from "next/link";
import { ExternalLink, Users } from "lucide-react";

import type { Person, SocialPlatformStats } from "@/lib/people/types";
import { PersonAvatar } from "./person-avatar";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

interface NetworkCardProps {
  person: Person;
  /** This network's link + cached stats for the person. */
  profileUrl: string;
  handle: string;
  stats: SocialPlatformStats | undefined;
  platformLabel: string;
}

/**
 * Network-view card: identity + the actual profile link + platform stats.
 * Deliberately NOT the generic people card — this view is about the network.
 */
export function NetworkCard({
  person,
  profileUrl,
  handle,
  stats,
  platformLabel,
}: NetworkCardProps) {
  const subtitle = [person.role, person.company].filter(Boolean).join(" · ");

  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-berry/40 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex items-center gap-3">
        <Link href={`/people/${person.id}`} className="shrink-0">
          <PersonAvatar name={person.name} photoUrl={person.photoUrl} size={48} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/people/${person.id}`}
            className="block truncate font-medium hover:underline"
          >
            {person.name}
          </Link>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {stats?.followers != null && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-berry/10 px-2.5 py-1 text-xs font-medium text-foreground"
            title={`${stats.followers.toLocaleString()} followers`}
          >
            <Users size={12} className="text-berry" />
            {formatCount(stats.followers)}
          </span>
        )}
      </div>

      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:border-berry/50 hover:text-foreground"
      >
        <span className="truncate text-muted-foreground">
          {platformLabel === "X" ? "@" : ""}
          {handle}
        </span>
        <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
      </a>

      {stats?.posts && (
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {stats.posts}
        </p>
      )}
    </div>
  );
}
