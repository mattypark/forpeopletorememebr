import "server-only";

import { z } from "zod";
import { normalizeUrl } from "@/lib/people/links";
import { fetchGithubFacts, type GithubFacts } from "./github";
import { generateJson } from "./gemini";

export interface EnrichInput {
  name: string;
  company?: string;
  role?: string;
  links?: string[];
}

export interface EnrichSuggestion {
  role: string | null;
  company: string | null;
  location: string | null;
  email: string | null;
  links: string[];
  tags: string[];
  notes: string | null;
  sources: string[];
  warnings: string[];
}

const geminiSchema = z.object({
  role: z.string().max(120).default(""),
  tags: z.array(z.string().max(40)).max(8).default([]),
  notes: z.string().max(600).default(""),
});

type GeminiOut = z.infer<typeof geminiSchema>;

/** Links are only ever derived from real GitHub facts — never invented by the LLM. */
function linksFromGithub(facts: GithubFacts): string[] {
  const out: string[] = [facts.htmlUrl];
  if (facts.blog) {
    const url = normalizeUrl(facts.blog);
    if (url) out.push(url);
  }
  if (facts.twitterUsername) {
    out.push(`https://x.com/${facts.twitterUsername}`);
  }
  return out;
}

async function inferWithGemini(
  input: EnrichInput,
  facts: GithubFacts | null,
): Promise<GeminiOut | null> {
  const context = [
    `Name: ${input.name}`,
    input.company && `Company (user-provided): ${input.company}`,
    input.role && `Role (user-provided): ${input.role}`,
    facts?.company && `GitHub company: ${facts.company}`,
    facts?.location && `Location: ${facts.location}`,
    facts?.bio && `GitHub bio: ${facts.bio}`,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You help fill in a personal contact card. Using ONLY the facts below, infer a concise profile. Do NOT invent URLs, emails, employers, or facts not implied by the input. Leave a field empty if unknown.

# Facts
${context}

# Return JSON
{"role": "<short title, e.g. 'ML engineer'>", "tags": ["<3-6 lowercase one-word tags, e.g. 'founder','design','open-source'>"], "notes": "<1-2 neutral sentences summarizing who they are; empty if facts are too thin>"}`;

  const raw = await generateJson<unknown>(prompt);
  if (!raw) return null;
  const parsed = geminiSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function enrichPerson(
  input: EnrichInput,
): Promise<EnrichSuggestion> {
  const existingLinks = input.links ?? [];
  const facts = await fetchGithubFacts(input.name, existingLinks);
  const gemini = await inferWithGemini(input, facts);

  const sources: string[] = [];
  const warnings: string[] = [];

  // Real links from GitHub, de-duplicated against what the user already has.
  const newLinks = facts
    ? linksFromGithub(facts).filter((l) => !existingLinks.includes(l))
    : [];
  if (facts) sources.push("GitHub");
  if (gemini) sources.push("Gemini");

  if (newLinks.length > 0) warnings.push("Verify the linked profiles are the right person.");
  if (!facts && !gemini) warnings.push("No confident matches found. Try adding a company or a GitHub link.");
  if (gemini && !facts) warnings.push("Role/notes are AI-inferred from sparse data — double-check.");

  const tags = [...new Set((gemini?.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean))];

  return {
    role: gemini?.role?.trim() || null,
    company: facts?.company?.replace(/^@/, "").trim() || null,
    location: facts?.location?.trim() || null,
    email: facts?.email?.trim() || null,
    links: newLinks,
    tags,
    notes: gemini?.notes?.trim() || facts?.bio?.trim() || null,
    sources,
    warnings,
  };
}
