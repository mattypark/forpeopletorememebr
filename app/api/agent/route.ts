import { createClient } from "@/lib/supabase/server";
import { getPeople } from "@/lib/people/queries";
import { askNetwork } from "@/lib/people/ask";
import { routeAsk, intakePerson } from "@/lib/people/agent";
import { scraperConfigured } from "@/lib/people/enrich/scraper-client";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // stealth scrapes are slow

/**
 * Bery agent — streams NDJSON events so the client can render live progress
 * like a terminal agent. Event protocol (one JSON object per line):
 *   {type:"step",   id, label, status:"running"|"done", detail?}
 *   {type:"source", label, url}          // web-grounded runs
 *   {type:"match",  id, name, subtitle, reason, opener}
 *   {type:"draft",  draft, needs, metContext}   // researched new-person draft
 *   {type:"answer", text}
 *   {type:"error",  message}
 *   {type:"done"}
 * Extend by adding event types — the client ignores unknown ones.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  let query = "";
  try {
    const body = (await req.json()) as { query?: unknown };
    query = typeof body.query === "string" ? body.query.trim().slice(0, 1000) : "";
  } catch {
    // fall through to the empty-query check
  }
  if (!query) {
    return Response.json({ error: "Ask something first" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      try {
        emit({
          type: "step",
          id: "route",
          label: "Reading your message",
          status: "running",
        });
        const route = await routeAsk(query);
        emit({
          type: "step",
          id: "route",
          label: "Reading your message",
          status: "done",
          detail:
            route.intent === "new_person"
              ? `sounds like someone new${route.name ? `: ${route.name}` : ""}`
              : "a question for your network",
        });

        if (route.intent === "new_person") {
          await runIntake(emit, query, route);
        } else {
          await runNetworkSearch(emit, query);
        }
        emit({ type: "done" });
      } catch (err) {
        emit({
          type: "error",
          message: err instanceof Error ? err.message : "Agent run failed",
        });
        emit({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

type Emit = (event: Record<string, unknown>) => void;

/** "Who can help with X" — rank the user's own contacts. */
async function runNetworkSearch(emit: Emit, query: string) {
  emit({
    type: "step",
    id: "roster",
    label: "Reading your network",
    status: "running",
  });
  const people = await getPeople();
  emit({
    type: "step",
    id: "roster",
    label: "Reading your network",
    status: "done",
    detail: `${people.length} ${people.length === 1 ? "person" : "people"} loaded`,
  });

  emit({
    type: "step",
    id: "rank",
    label: `Matching against “${query}”`,
    status: "running",
  });
  const result = await askNetwork(query, people);
  emit({
    type: "step",
    id: "rank",
    label: `Matching against “${query}”`,
    status: "done",
    detail: result.usedAi
      ? "ranked with Gemini"
      : "keyword pass — no GEMINI_API_KEY set",
  });

  emit({
    type: "step",
    id: "results",
    label: "Assembling matches",
    status: "running",
  });
  for (const match of result.matches) {
    emit({
      type: "match",
      id: match.person.id,
      name: match.person.name,
      subtitle: [match.person.role, match.person.company]
        .filter(Boolean)
        .join(" · "),
      reason: match.reason,
      opener: match.opener,
      photoUrl: match.person.photoUrl,
    });
  }
  emit({
    type: "step",
    id: "results",
    label: "Assembling matches",
    status: "done",
    detail: `${result.matches.length} ${result.matches.length === 1 ? "match" : "matches"}`,
  });

  emit({ type: "answer", text: result.answer });
}

/** "I met someone" — research the web and build a save-ready draft. */
async function runIntake(
  emit: Emit,
  query: string,
  route: Awaited<ReturnType<typeof routeAsk>>,
) {
  const scraping = scraperConfigured();
  emit({
    type: "step",
    id: "research",
    label: `Researching ${route.name || "them"} on the web`,
    status: "running",
    detail: scraping
      ? "Gemini search + Scrapling on LinkedIn/Instagram/GitHub"
      : "Gemini search (start the scraper sidecar for deeper scrapes)",
  });

  const intake = await intakePerson(query, route);

  emit({
    type: "step",
    id: "research",
    label: `Researching ${intake.draft.name || "them"} on the web`,
    status: "done",
    detail: intake.usedScraper
      ? `scraped ${intake.scrapedProfiles.length || intake.draft.links.length} profile page${intake.scrapedProfiles.length === 1 ? "" : "s"}`
      : `${intake.draft.links.length} link${intake.draft.links.length === 1 ? "" : "s"} found`,
  });

  for (const source of intake.sources.slice(0, 6)) {
    emit({ type: "source", label: source.title, url: source.url });
  }

  emit({
    type: "step",
    id: "draft",
    label: "Assembling profile draft",
    status: "done",
    detail:
      [
        intake.draft.role && "role",
        intake.draft.company && "company",
        intake.draft.location && "location",
        intake.draft.links.length && `${intake.draft.links.length} links`,
        intake.needs && "what you need them for",
        intake.metContext && "how you met",
      ]
        .filter(Boolean)
        .join(", ") || "sparse — add more details",
  });

  emit({
    type: "draft",
    draft: intake.draft,
    needs: intake.needs,
    metContext: intake.metContext,
  });
  emit({ type: "answer", text: intake.reply });
}
