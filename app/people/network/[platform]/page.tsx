import { notFound } from "next/navigation";

import { getPeople } from "@/lib/people/queries";
import { platformBySlug, filterByPlatform, PLATFORMS } from "@/lib/people/platforms";
import { PeopleBrowser } from "@/components/people/people-browser";

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

  const people = await getPeople();
  const filtered = filterByPlatform(people, def.platform);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          {def.label}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          People with a {def.label} profile.
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No one with a {def.label} link yet. Add a {def.label} URL to a person
          and they&apos;ll show up here.
        </div>
      ) : (
        <PeopleBrowser people={filtered} />
      )}
    </div>
  );
}
