import "server-only";

import { z } from "zod";
import { generateJson } from "./enrich/gemini";
import type { Person } from "./types";

/**
 * Intent retrieval — "who in my network can help with X?"
 * Ranks the user's own people against a goal or question, with a reason and
 * a suggested opener per match. Falls back to keyword scoring when no
 * GEMINI_API_KEY is configured so the feature never dead-ends.
 */

export interface NetworkMatch {
  person: Person;
  reason: string;
  opener: string;
  score: number;
}

export interface AskResult {
  answer: string;
  matches: NetworkMatch[];
  usedAi: boolean;
}

const MAX_MATCHES = 6;
const NOTES_CLIP = 220;

const aiResponseSchema = z.object({
  answer: z.string().max(600).default(""),
  matches: z
    .array(
      z.object({
        id: z.string(),
        reason: z.string().max(300).default(""),
        opener: z.string().max(300).default(""),
        score: z.number().min(0).max(1).default(0.5),
      }),
    )
    .max(MAX_MATCHES * 2)
    .default([]),
});

function clip(text: string | null, max: number): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function rosterLine(p: Person): string {
  const parts = [
    `id:${p.id}`,
    `name:${p.name}`,
    p.role && `role:${p.role}`,
    p.company && `company:${p.company}`,
    p.location && `location:${p.location}`,
    p.tags.length > 0 && `tags:${p.tags.join(",")}`,
    p.metContext && `met:${clip(p.metContext, 120)}`,
    p.needs && `needs:${clip(p.needs, 120)}`,
    p.notes && `notes:${clip(p.notes, NOTES_CLIP)}`,
  ].filter(Boolean);
  return parts.join(" | ");
}

function buildPrompt(query: string, people: Person[]): string {
  const roster = people.map(rosterLine).join("\n");
  return `You match a user's real-life contacts to what the user needs right now.

THE USER'S NEED: "${query}"

THE USER'S CONTACTS (one per line, private data — never invent people or facts):
${roster}

Rank up to ${MAX_MATCHES} contacts who could plausibly help with this need — directly (they do the thing) or one hop away (they likely know people who do). Judge from role, company, tags, where they met, notes. Skip anyone with no plausible connection; an empty list is a valid answer.

Respond with ONLY this JSON:
{
  "answer": "1-2 sentence summary of who can help and how (or say nobody fits)",
  "matches": [
    {"id": "<contact id verbatim>", "reason": "why this person, grounded in their listed details", "opener": "a one-line, casual first message the user could send them", "score": 0.0-1.0}
  ]
}
Order matches best-first. Use only ids from the list.`;
}

/** Keyword-overlap fallback ranking used when the AI is unavailable. */
function heuristicMatches(query: string, people: Person[]): NetworkMatch[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
  if (terms.length === 0) return [];

  const scored = people.map((person) => {
    const haystack = [
      person.name,
      person.role,
      person.company,
      person.location,
      person.needs,
      person.notes,
      person.metContext,
      person.tags.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const hits = terms.filter((t) => haystack.includes(t));
    return { person, hits };
  });

  return scored
    .filter((s) => s.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length)
    .slice(0, MAX_MATCHES)
    .map(({ person, hits }) => ({
      person,
      reason: `Profile mentions ${hits.map((h) => `“${h}”`).join(", ")}.`,
      opener: "",
      score: hits.length / terms.length,
    }));
}

export async function askNetwork(
  query: string,
  people: Person[],
): Promise<AskResult> {
  if (people.length === 0) {
    return { answer: "You haven't added anyone yet.", matches: [], usedAi: false };
  }

  const raw = await generateJson<unknown>(buildPrompt(query, people));
  if (raw) {
    const parsed = aiResponseSchema.safeParse(raw);
    if (parsed.success) {
      const byId = new Map(people.map((p) => [p.id, p]));
      const seen = new Set<string>();
      const matches: NetworkMatch[] = [];
      for (const m of parsed.data.matches) {
        const person = byId.get(m.id);
        if (!person || seen.has(m.id)) continue;
        seen.add(m.id);
        matches.push({ person, reason: m.reason, opener: m.opener, score: m.score });
        if (matches.length >= MAX_MATCHES) break;
      }
      return {
        answer: parsed.data.answer || summarize(matches),
        matches,
        usedAi: true,
      };
    }
  }

  const matches = heuristicMatches(query, people);
  return {
    answer:
      matches.length > 0
        ? `${matches.length} likely ${matches.length === 1 ? "match" : "matches"} by keyword. Add GEMINI_API_KEY for smarter ranking.`
        : "No obvious matches by keyword. Add GEMINI_API_KEY for smarter ranking.",
    matches,
    usedAi: false,
  };
}

/**
 * Instant, zero-cost ranking for dashboard surfaces — no AI call. The Ask
 * page does the smart ranking; this keeps "act on today" free and fast.
 */
export function rankPeopleForGoal(
  goalText: string,
  people: Person[],
  limit = 3,
): NetworkMatch[] {
  return heuristicMatches(goalText, people).slice(0, limit);
}

function summarize(matches: NetworkMatch[]): string {
  if (matches.length === 0) return "Nobody in your network clearly fits this.";
  return `${matches.length} ${matches.length === 1 ? "person" : "people"} in your network could help.`;
}

/**
 * Reverse matching — given one person, which of the user's open goals do
 * they serve? Cheap keyword pass; used as an instant signal on person pages.
 */
export interface GoalHit {
  goalId: string;
  title: string;
}

export function matchPersonToGoals(
  person: Person,
  goals: Array<{ id: string; title: string; details: string | null }>,
): GoalHit[] {
  const haystack = [
    person.role,
    person.company,
    person.needs,
    person.notes,
    person.metContext,
    person.tags.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return goals
    .filter((goal) => {
      const terms = `${goal.title} ${goal.details ?? ""}`
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 3);
      return terms.some((t) => haystack.includes(t));
    })
    .map((goal) => ({ goalId: goal.id, title: goal.title }));
}
