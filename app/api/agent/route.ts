import { createClient } from "@/lib/supabase/server";
import { getPeople } from "@/lib/people/queries";
import { askNetwork } from "@/lib/people/ask";

export const dynamic = "force-dynamic";

/**
 * Bery agent — streams NDJSON events so the client can render live progress
 * like a terminal agent. Event protocol (one JSON object per line):
 *   {type:"step",   id, label, status:"running"|"done", detail?}
 *   {type:"source", label, url}          // reserved for web-grounded runs
 *   {type:"match",  id, name, subtitle, reason, opener}
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
    query = typeof body.query === "string" ? body.query.trim().slice(0, 500) : "";
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
