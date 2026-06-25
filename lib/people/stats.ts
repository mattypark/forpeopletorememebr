import type { Person } from "./types";

export interface MetBucket {
  label: string;
  count: number;
}

export interface DashboardStats {
  total: number;
  newThisWeek: number;
  toReconnectCount: number;
  recent: Person[];
  reconnect: Person[];
  metSeries: MetBucket[];
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const RECONNECT_DAYS = 30;
const MONTHS_BACK = 6;

function daysSince(iso: string, now: number): number {
  return (now - new Date(iso).getTime()) / (24 * 60 * 60 * 1000);
}

/** A person is "to reconnect" if they have an open need or haven't been touched in a month. */
function needsReconnect(person: Person, now: number): boolean {
  if (person.needs && person.needs.trim()) return true;
  return daysSince(person.updatedAt, now) > RECONNECT_DAYS;
}

function buildMetSeries(people: Person[], now: number): MetBucket[] {
  const ref = new Date(now);
  const buckets: MetBucket[] = [];
  const index = new Map<string, number>();

  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleString("en", { month: "short" });
    index.set(key, buckets.length);
    buckets.push({ label, count: 0 });
  }

  for (const person of people) {
    const when = person.metAt ?? person.createdAt;
    const d = new Date(when);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const at = index.get(key);
    if (at !== undefined) buckets[at].count += 1;
  }

  return buckets;
}

/** Derives every Overview stat from the already-loaded people list. */
export function computeStats(people: Person[], now: number): DashboardStats {
  const reconnect = people
    .filter((p) => needsReconnect(p, now))
    .sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    );

  return {
    total: people.length,
    newThisWeek: people.filter(
      (p) => now - new Date(p.createdAt).getTime() <= WEEK_MS,
    ).length,
    toReconnectCount: reconnect.length,
    recent: people.slice(0, 6),
    reconnect: reconnect.slice(0, 5),
    metSeries: buildMetSeries(people, now),
  };
}
