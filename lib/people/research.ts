import "server-only";

import { z } from "zod";
import {
  generateGrounded,
  type ChatTurn,
  type GroundingSource,
} from "./enrich/gemini";

export interface ResearchMessage {
  role: "user" | "assistant";
  content: string;
}

const draftSchema = z.object({
  name: z.string().max(200).default(""),
  role: z.string().max(200).default(""),
  company: z.string().max(200).default(""),
  location: z.string().max(200).default(""),
  email: z.string().max(200).default(""),
  summary: z.string().max(1000).default(""),
  tags: z.array(z.string().max(40)).max(12).default([]),
  links: z.array(z.string().max(400)).max(20).default([]),
});

export type ResearchDraft = z.infer<typeof draftSchema>;

export interface ResearchResult {
  reply: string;
  draft: ResearchDraft | null;
  sources: GroundingSource[];
}

const SYSTEM = `You are a research assistant inside a personal CRM called Rolodex. The user describes someone they met in real life and wants their public professional details gathered.

Use web search to find THIS SPECIFIC person. Pin down the right individual using every disambiguating detail the user gives (company, city, school, role, mutual context, handles). If the person is genuinely ambiguous, ask ONE concise clarifying question instead of guessing.

Find only PUBLIC info: current role/title, company, city/location, LinkedIn URL, other real profile URLs (GitHub, X, Instagram, personal site), and a public email ONLY if clearly published. Never fabricate a URL, email, or fact — include a link only if your search actually surfaced it.

You CANNOT know private facts the user holds: their phone number, or where/how the user met them. Never invent these — the user fills those in themselves.

Always respond in two parts:
1. A short, friendly message (2-4 sentences) summarizing what you found or asking your clarifying question.
2. Then a fenced code block tagged json containing the draft you've assembled so far:

\`\`\`json
{"name":"","role":"","company":"","location":"","email":"","summary":"","tags":[],"links":[]}
\`\`\`

Leave any unknown field as an empty string or empty array. "summary" is 1-2 neutral sentences about who they are. "tags" are 3-6 short lowercase descriptors. Only put real, found URLs in "links". Always include the json block, even if mostly empty.`;

function extractDraft(text: string): { reply: string; draftRaw: unknown | null } {
  const match = text.match(/```json\s*([\s\S]*?)```/i);
  if (!match) return { reply: text.trim(), draftRaw: null };

  const reply = text.replace(match[0], "").trim();
  try {
    return { reply, draftRaw: JSON.parse(match[1].trim()) };
  } catch {
    return { reply, draftRaw: null };
  }
}

export async function researchPerson(
  messages: ResearchMessage[],
): Promise<ResearchResult> {
  const contents: ChatTurn[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await generateGrounded(contents, SYSTEM);
  if (!res) {
    return {
      reply:
        "Web research is unavailable. Set GEMINI_API_KEY in your environment to enable it.",
      draft: null,
      sources: [],
    };
  }

  const { reply, draftRaw } = extractDraft(res.text);
  let draft: ResearchDraft | null = null;
  if (draftRaw) {
    const parsed = draftSchema.safeParse(draftRaw);
    if (parsed.success) draft = parsed.data;
  }

  return { reply: reply || res.text, draft, sources: res.sources };
}
