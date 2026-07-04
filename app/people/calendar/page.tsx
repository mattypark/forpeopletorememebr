import { MapPin } from "lucide-react";

import { getPeople } from "@/lib/people/queries";
import { MetCalendar } from "@/components/calendar/met-calendar";

export default async function CalendarPage() {
  const people = await getPeople();

  const dated = people.filter((p) => p.metAt);
  const undated = people.length - dated.length;

  // "Where you meet people most" — frequency of met_context.
  const placeCounts = new Map<string, number>();
  for (const p of people) {
    const place = p.metContext?.trim();
    if (!place) continue;
    const key = place.toLowerCase();
    placeCounts.set(key, (placeCounts.get(key) ?? 0) + 1);
  }
  const places = [...placeCounts.entries()]
    .map(([place, count]) => ({ place, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const maxPlace = Math.max(1, ...places.map((p) => p.count));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Calendar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          When you met people — and where you meet them most.
        </p>
      </div>

      {dated.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No met-dates yet. Add a &ldquo;Date met&rdquo; to people and they&apos;ll
          appear on the calendar.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <MetCalendar people={people} />

          <aside className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="kicker">
                Where you meet people
              </p>
              {places.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Add &ldquo;How we met&rdquo; to people to see your hotspots.
                </p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {places.map(({ place, count }) => (
                    <li key={place} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <MapPin size={12} className="shrink-0 text-muted-foreground" />
                          <span className="truncate capitalize">{place}</span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-berry/80"
                          style={{ width: `${(count / maxPlace) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="kicker">
                On the calendar
              </p>
              <p className="mt-2 font-serif text-2xl font-semibold tabular-nums">
                {dated.length}
              </p>
              <p className="text-xs text-muted-foreground">
                people with a met-date
                {undated > 0 && ` · ${undated} undated`}
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
