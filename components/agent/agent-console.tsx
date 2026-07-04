"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  CornerDownLeft,
  Globe,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { PersonAvatar } from "@/components/people/person-avatar";

interface AgentStep {
  id: string;
  label: string;
  status: "running" | "done";
  detail?: string;
}

interface AgentSource {
  label: string;
  url: string;
}

interface AgentMatch {
  id: string;
  name: string;
  subtitle: string;
  reason: string;
  opener: string;
  photoUrl: string | null;
}

type Phase = "idle" | "typing" | "running" | "done";

/**
 * Terminal-style agent surface for the Overview: click → type → Enter →
 * live step feed streamed from /api/agent (NDJSON). Unknown event types
 * are ignored so the backend can grow richer (web sources, tools) without
 * breaking this client.
 */
export function AgentConsole() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [query, setQuery] = useState("");
  const [ran, setRan] = useState("");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [sources, setSources] = useState<AgentSource[]>([]);
  const [matches, setMatches] = useState<AgentMatch[]>([]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setSteps([]);
    setSources([]);
    setMatches([]);
    setAnswer("");
    setError(null);
  };

  const handleEvent = (event: Record<string, unknown>) => {
    switch (event.type) {
      case "step": {
        const step = event as unknown as AgentStep;
        setSteps((prev) => {
          const at = prev.findIndex((s) => s.id === step.id);
          if (at === -1) return [...prev, step];
          const next = [...prev];
          next[at] = step;
          return next;
        });
        break;
      }
      case "source":
        setSources((prev) => [...prev, event as unknown as AgentSource]);
        break;
      case "match":
        setMatches((prev) => [...prev, event as unknown as AgentMatch]);
        break;
      case "answer":
        setAnswer(typeof event.text === "string" ? event.text : "");
        break;
      case "error":
        setError(typeof event.message === "string" ? event.message : "Agent run failed");
        break;
      default:
        break; // forward-compatible: skip unknown event types
    }
  };

  const run = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || phase === "running") return;
    reset();
    setRan(trimmed);
    setPhase("running");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Agent failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            handleEvent(JSON.parse(line) as Record<string, unknown>);
          } catch {
            // partial/garbled line — skip
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent run failed");
    }
    setPhase("done");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(query);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && phase === "typing") setPhase("idle");
  };

  if (phase === "idle") {
    return (
      <button
        type="button"
        onClick={() => {
          setPhase("typing");
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card/70 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-berry/40 hover:text-foreground"
      >
        <Sparkles size={16} className="text-berry" />
        Ask the agent anything — “who can intro me to a climate VC?”
        <span className="ml-auto hidden items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide sm:inline-flex">
          click to type
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card/70 p-4">
      <form onSubmit={submit} className="flex items-center gap-3">
        <Sparkles size={16} className="shrink-0 text-berry" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask your network anything…"
          disabled={phase === "running"}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        {phase === "running" ? (
          <Loader2 size={15} className="shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <button
            type="submit"
            disabled={!query.trim()}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-berry/40 hover:text-foreground disabled:opacity-40"
          >
            <CornerDownLeft size={11} />
            enter
          </button>
        )}
      </form>

      {(steps.length > 0 || error) && (
        <div className="space-y-1.5 border-t border-border/60 pt-3 font-mono text-xs">
          <AnimatePresence initial={false}>
            {steps.map((step) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-2"
              >
                {step.status === "running" ? (
                  <Loader2 size={12} className="mt-0.5 shrink-0 animate-spin text-berry" />
                ) : (
                  <Check size={12} className="mt-0.5 shrink-0 text-berry" />
                )}
                <span
                  className={cn(
                    step.status === "running" ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                  {step.detail && (
                    <span className="text-muted-foreground/70"> — {step.detail}</span>
                  )}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {error && <p className="text-destructive">{error}</p>}
        </div>
      )}

      {sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sources.map((s, i) => (
            <a
              key={`${s.url}-${i}`}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-[200px] items-center gap-1 truncate rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Globe size={10} className="shrink-0" />
              <span className="truncate">{s.label}</span>
            </a>
          ))}
        </div>
      )}

      {matches.length > 0 && (
        <ul className="divide-y divide-border/60">
          <AnimatePresence initial={false}>
            {matches.map((match) => (
              <motion.li
                key={match.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/people/${match.id}`}
                  className="group flex items-start gap-3 py-2.5"
                >
                  <PersonAvatar
                    name={match.name}
                    photoUrl={match.photoUrl ?? null}
                    size={34}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {match.name}
                      {match.subtitle && (
                        <span className="ml-2 font-normal text-muted-foreground">
                          {match.subtitle}
                        </span>
                      )}
                    </span>
                    {match.reason && (
                      <span className="block text-xs text-muted-foreground">
                        {match.reason}
                      </span>
                    )}
                    {match.opener && (
                      <span className="mt-0.5 block text-xs italic text-muted-foreground/80">
                        “{match.opener}”
                      </span>
                    )}
                  </span>
                  <ArrowRight
                    size={14}
                    className="mt-1 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-berry"
                  />
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {phase === "done" && answer && (
        <p className="text-sm text-muted-foreground">{answer}</p>
      )}

      {phase === "done" && (
        <button
          type="button"
          onClick={() => {
            reset();
            setQuery("");
            setRan("");
            setPhase("typing");
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw size={12} />
          Ask something else
        </button>
      )}

      {phase === "running" && ran && (
        <p className="sr-only" aria-live="polite">
          Agent working on {ran}
        </p>
      )}
    </div>
  );
}
