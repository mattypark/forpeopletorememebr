import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPeople } from "@/lib/people/queries";
import { computeStats } from "@/lib/people/stats";
import { StatCard } from "@/components/dashboard/stat-card";
import { MetChart } from "@/components/dashboard/met-chart";
import { PersonCard } from "@/components/people/person-card";
import { PersonAvatar } from "@/components/people/person-avatar";

export default async function OverviewPage() {
  const people = await getPeople();
  const stats = computeStats(people, Date.now());

  if (people.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-20 text-center">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Welcome to Rolodex
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Your personal directory of everyone you meet — and why they matter.
          Add the first person to get started.
        </p>
        <Button asChild className="mt-5">
          <Link href="/people/new">
            <Plus className="mr-1.5" size={16} />
            Add your first person
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your network at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="People" value={stats.total} hint="total in your rolodex" accent />
        <StatCard label="New this week" value={stats.newThisWeek} hint="added in the last 7 days" />
        <StatCard label="To reconnect" value={stats.toReconnectCount} hint="open needs or gone quiet" />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold tracking-tight">
            Recently met
          </h2>
          <Link
            href="/people/all"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.recent.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <MetChart data={stats.metSeries} />

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reconnect
          </h2>
          {stats.reconnect.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              You&apos;re all caught up. Nobody&apos;s gone quiet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {stats.reconnect.map((person) => (
                <li key={person.id}>
                  <Link
                    href={`/people/${person.id}`}
                    className="flex items-center gap-3 py-2.5 transition-colors hover:text-foreground"
                  >
                    <PersonAvatar
                      name={person.name}
                      photoUrl={person.photoUrl}
                      size={36}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {person.name}
                      </span>
                      {person.needs && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {person.needs}
                        </span>
                      )}
                    </span>
                    <ArrowRight size={14} className="text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
