import "server-only";

import { z } from "zod";
import { generateJson } from "./enrich/gemini";
import { researchPerson, type ResearchDraft } from "./research";
import {
  scrapePerson,
  scrapeUrls,
  scraperConfigured,
  type ScrapedPage,
} from "./enrich/scraper-client";
import type { GroundingSource } from "./enrich/gemini";

/**
 * The Bery intake agent: turn a free-text description of someone the user met
 * ("Yurii, met him through linkedin, cracked at swe, yc founder…") into a
 * filled-out person draft by combining:
 *   1. what the user SAID (private facts — how they met, what they need them for)
 *   2. Gemini grounded web search (public profiles)
 *   3. the Scrapling sidecar (deep-scraped LinkedIn/Instagram/GitHub pages)
 */

export interface AskRoute {
  intent: "find_help" | "new_person";
  name: string;
  hints: string[];
  needs: string;
  metContext: string;
}

const routeSchema = z.object({
  intent: z.enum(["find_help", "new_person"]).default("find_help"),
  name: z.string().max(120).default(""),
  hints: z.array(z.string().max(60)).max(6).default([]),
  needs: z.string().max(400).default(""),
  metContext: z.string().max(400).default(""),
});

/**
 * Classify what the user typed into the agent box, and extract the private
 * facts only they could know. Falls back to "find_help" (harmless default —
 * network search) when the AI is unavailable.
 */
export async function routeAsk(query: string): Promise<AskRoute> {
  const prompt = `You are the router for a personal-CRM agent. The user typed the text below into the agent box. Decide the intent:

- "find_help": they are ASKING their existing network for something ("who can intro me to a climate VC?", "who works in healthcare?").
- "new_person": they are DESCRIBING a specific person they met so the agent can research and save them ("Yurii Tovarnytskyi, met him through linkedin, he's a yc founder…"). Signals: a person's name plus facts about that person, past-tense meeting context.

USER TEXT: "${query.replace(/"/g, "'")}"

Also extract, ONLY from the user's own words (never invent):
- name: the person's full name if this describes a person, else ""
- hints: up to 4 short search disambiguators they mentioned (company, city, school, role, e.g. "yc founder", "swe")
- needs: what the user wants from/with this person, in the user's words, else ""
- metContext: how/where the user met them, in the user's words, else ""

Respond with ONLY this JSON:
{"intent":"find_help|new_person","name":"","hints":[],"needs":"","metContext":""}`;

  const raw = await generateJson<unknown>(prompt);
  const parsed = routeSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return { intent: "find_help", name: "", hints: [], needs: "", metContext: "" };
}

export interface IntakeResult {
  draft: ResearchDraft;
  needs: string;
  metContext: string;
  sources: GroundingSource[];
  scrapedProfiles: string[];
  reply: string;
  usedScraper: boolean;
}

const EMPTY_DRAFT: ResearchDraft = {
  name: "",
  role: "",
  company: "",
  location: "",
  email: "",
  summary: "",
  tags: [],
  links: [],
};

const scrapedDraftSchema = z.object({
  role: z.string().max(200).default(""),
  company: z.string().max(200).default(""),
  location: z.string().max(200).default(""),
  email: z.string().max(200).default(""),
  summary: z.string().max(1000).default(""),
  tags: z.array(z.string().max(40)).max(8).default([]),
  confirmedUrls: z.array(z.string().max(400)).max(8).default([]),
});

function pagesBlock(pages: ScrapedPage[]): string {
  return pages
    .filter((p) => p.ok)
    .map(
      (p) =>
        `URL: ${p.url}\nTitle: ${p.title}\nDescription: ${p.description}\nContent: ${p.text.slice(0, 3500)}`,
    )
    .join("\n\n---\n\n");
}

/** Extract a draft from Scrapling-fetched profile pages. */
async function draftFromScrapedPages(
  description: string,
  name: string,
  pages: ScrapedPage[],
): Promise<z.infer<typeof scrapedDraftSchema> | null> {
  const block = pagesBlock(pages);
  if (!block) return null;

  const prompt = `The user described someone they met: "${description.replace(/"/g, "'")}"

Below are web pages scraped while searching for that person${name ? ` ("${name}")` : ""}. Some pages may be about a DIFFERENT person with a similar name — use the user's description to decide which pages actually match. Ignore non-matching pages entirely.

${block}

From ONLY the matching pages, extract the person's public details. Never invent facts; leave a field "" if unknown. confirmedUrls = the URLs of pages you judged to be about the right person.

Respond with ONLY this JSON:
{"role":"","company":"","location":"","email":"","summary":"1-2 neutral sentences","tags":["3-6 short lowercase descriptors"],"confirmedUrls":[]}`;

  const raw = await generateJson<unknown>(prompt);
  const parsed = scrapedDraftSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function pick(a: string, b: string): string {
  return a.trim() ? a : b;
}

/**
 * Full intake: web-research a described person via Gemini grounding AND the
 * Scrapling sidecar in parallel, then merge into one draft. Either source can
 * be missing (no GEMINI_API_KEY → scraper only; no SCRAPER_URL → Gemini only).
 */
export async function intakePerson(
  description: string,
  route?: AskRoute,
): Promise<IntakeResult> {
  const resolved = route ?? (await routeAsk(description));
  const name = resolved.name || description.split(/[,.\n]/)[0].trim().slice(0, 80);
  const scraping = scraperConfigured();

  // Gemini grounded search (finds profile URLs) and the Scrapling search-based
  // lookup run in parallel; then Scrapling deep-scrapes whatever Gemini found.
  const [research, scraped] = await Promise.all([
    researchPerson([{ role: "user", content: description }]).catch(() => null),
    scraping ? scrapePerson(name, resolved.hints).catch(() => null) : Promise.resolve(null),
  ]);

  const searchPages = scraped?.pages ?? [];
  const alreadyScraped = new Set(searchPages.map((p) => p.url));
  const geminiLinks = (research?.draft?.links ?? []).filter(
    (l) => !alreadyScraped.has(l),
  );
  const linkPages = scraping ? await scrapeUrls(geminiLinks).catch(() => []) : [];

  const pages = [...searchPages, ...linkPages];
  const scrapedDraft = pages.length
    ? await draftFromScrapedPages(description, name, pages)
    : null;

  const base = research?.draft ?? EMPTY_DRAFT;
  const draft: ResearchDraft = {
    name: pick(base.name, name),
    role: pick(base.role, scrapedDraft?.role ?? ""),
    company: pick(base.company, scrapedDraft?.company ?? ""),
    location: pick(base.location, scrapedDraft?.location ?? ""),
    email: pick(base.email, scrapedDraft?.email ?? ""),
    summary: pick(base.summary, scrapedDraft?.summary ?? ""),
    tags: [...new Set([...base.tags, ...(scrapedDraft?.tags ?? [])])].slice(0, 8),
    links: [
      ...new Set([...base.links, ...(scrapedDraft?.confirmedUrls ?? [])]),
    ].slice(0, 12),
  };

  return {
    draft,
    needs: resolved.needs,
    metContext: resolved.metContext,
    sources: research?.sources ?? [],
    scrapedProfiles: scrapedDraft?.confirmedUrls ?? scraped?.candidates ?? [],
    reply:
      research?.reply ||
      (draft.links.length
        ? `Found ${draft.links.length} likely profile${draft.links.length > 1 ? "s" : ""} for ${draft.name}.`
        : `Couldn't confirm public profiles for ${draft.name} — the draft uses what you told me. Add a company or city and try again.`),
    usedScraper: Boolean(scrapedDraft),
  };
}
