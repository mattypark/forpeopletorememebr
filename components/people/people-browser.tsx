"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Person } from "@/lib/people/types";
import { PersonCard } from "./person-card";

interface PeopleBrowserProps {
  people: Person[];
}

export function PeopleBrowser({ people }: PeopleBrowserProps) {
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const person of people) {
      for (const tag of person.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
  }, [people]);

  const fuse = useMemo(
    () =>
      new Fuse(people, {
        keys: ["name", "role", "company", "location", "needs", "notes", "tags"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [people],
  );

  const results = useMemo(() => {
    const base = query.trim()
      ? fuse.search(query.trim()).map((r) => r.item)
      : people;
    if (activeTags.length === 0) return base;
    return base.filter((person) =>
      activeTags.every((tag) => person.tags.includes(tag)),
    );
  }, [query, activeTags, fuse, people]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, what you need them for, company…"
          className="pl-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => {
            const active = activeTags.includes(tag);
            return (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}>
                <Badge
                  variant={active ? "default" : "outline"}
                  className="cursor-pointer font-normal transition-colors hover:border-foreground/40"
                >
                  {tag}
                </Badge>
              </button>
            );
          })}
          {activeTags.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTags([])}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {results.length} {results.length === 1 ? "person" : "people"}
      </p>

      {results.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No matches. Try a different search or clear the filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
