"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Person } from "@/lib/people/types";
import { PersonAvatar } from "@/components/people/person-avatar";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });
}

interface MetCalendarProps {
  people: Person[];
}

export function MetCalendar({ people }: MetCalendarProps) {
  // Group dated people by their met date (YYYY-MM-DD).
  const byDate = useMemo(() => {
    const map = new Map<string, Person[]>();
    for (const p of people) {
      if (!p.metAt) continue;
      const list = map.get(p.metAt) ?? [];
      list.push(p);
      map.set(p.metAt, list);
    }
    return map;
  }, [people]);

  // Start on the month of the most recent met date, else today.
  const initial = useMemo(() => {
    const dates = [...byDate.keys()].sort();
    const latest = dates[dates.length - 1];
    const d = latest ? new Date(latest) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [byDate]);

  const [view, setView] = useState(initial);
  const [selected, setSelected] = useState<string | null>(null);

  const { year, month } = view;
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ day: number; key: string } | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: `${year}-${pad(month + 1)}-${pad(d)}` });
  }

  const shift = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
    setSelected(null);
  };

  const selectedPeople = selected ? (byDate.get(selected) ?? []) : [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold tracking-tight">
            {monthLabel(year, month)}
          </h2>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous month">
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next month">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={i}
              className="pb-1 text-center text-xs font-medium text-muted-foreground"
            >
              {w}
            </div>
          ))}
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} />;
            const met = byDate.get(cell.key);
            const count = met?.length ?? 0;
            const isSelected = selected === cell.key;
            return (
              <button
                key={i}
                type="button"
                disabled={count === 0}
                onClick={() => setSelected(cell.key)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors",
                  count > 0
                    ? "cursor-pointer hover:bg-[#e76f51]/10"
                    : "text-muted-foreground/50",
                  isSelected && "bg-[#e76f51]/15 ring-1 ring-[#e76f51]/40",
                )}
              >
                <span className={count > 0 ? "font-medium" : undefined}>
                  {cell.day}
                </span>
                {count > 0 && (
                  <span className="mt-0.5 flex gap-0.5">
                    {Array.from({ length: Math.min(count, 3) }).map((_, d) => (
                      <span
                        key={d}
                        className="h-1 w-1 rounded-full bg-[#e76f51]"
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium">
            Met on{" "}
            {new Date(selected).toLocaleDateString("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          {selectedPeople.length === 0 ? (
            <p className="text-sm text-muted-foreground">No one this day.</p>
          ) : (
            <ul className="divide-y divide-border">
              {selectedPeople.map((person) => (
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
                      {person.metContext && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {person.metContext}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
