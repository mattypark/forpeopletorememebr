import Link from "next/link";
import { ArrowRight, Plus, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { getPeople } from "@/lib/people/queries";
import { getActiveGoals } from "@/lib/people/goals";
import { rankPeopleForGoal } from "@/lib/people/ask";
import { computeStats } from "@/lib/people/stats";
import { StatCard } from "@/components/dashboard/stat-card";
import { MetChart } from "@/components/dashboard/met-chart";
import { PersonCard } from "@/components/people/person-card";
import { PersonAvatar } from "@/components/people/person-avatar";
import { AgentConsole } from "@/components/agent/agent-console";

export default async function OverviewPage() {
  const [people, activeGoals] = await Promise.all([
    getPeople(),
    getActiveGoals(),
  ]);
  const stats = computeStats(people, Date.now());

  if (people.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-20 text-center">
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Welcome to Bery
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Everyone you meet, remembered — and searchable by what you need.
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

  const topGoal = activeGoals[0];
  const goalMatches = topGoal
    ? rankPeopleForGoal(
        `${topGoal.title} ${topGoal.details ?? ""}`,
        people,
      )
    : [];

  return (
    <div className="space-y-10">
      <PageHeader kicker="Your network" title="Overview" />

      {/* Act on today — people tied to a live reason, not random reconnects. */}
      <section className="rounded-xl border border-berry/25 bg-berry/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 kicker">
            <Target size={14} className="text-berry" />
            Act on today
          </h2>
          <Link
            href="/people/goals"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            All goals
          </Link>
        </div>

        <div className="mt-3">
          <AgentConsole />
        </div>

        {!topGoal ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            <p className="text-sm text-muted-foreground">
              Or add a goal and Bery keeps surfacing who in your network can
              move it forward.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/people/goals">
                <Plus className="mr-1" size={14} />
                Add a goal
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
            <p className="font-serif text-lg font-semibold tracking-tight">
              {topGoal.title}
            </p>
            {goalMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No obvious matches yet — ask the AI to read deeper.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {goalMatches.map((match) => (
                  <li key={match.person.id}>
                    <Link
                      href={`/people/${match.person.id}`}
                      className="group flex items-center gap-3 py-2.5"
                    >
                      <PersonAvatar
                        name={match.person.name}
                        photoUrl={match.person.photoUrl}
                        size={36}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {match.person.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {match.reason}
                        </span>
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-berry"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild size="sm" variant="outline">
              <Link
                href={`/people/ask?q=${encodeURIComponent(topGoal.title)}`}
              >
                <Sparkles className="mr-1.5" size={14} />
                Ask AI who can help
              </Link>
            </Button>
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="People" value={stats.total} hint="people remembered" accent />
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
          <h2 className="kicker">
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
