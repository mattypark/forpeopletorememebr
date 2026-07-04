"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, MessageCircleQuestion, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askNetworkAction, type AskState } from "@/lib/people/actions";
import type { NetworkMatch } from "@/lib/people/ask";
import { PersonAvatar } from "@/components/people/person-avatar";

const EXAMPLES = [
  "who can intro me to a climate VC?",
  "who could help me hire a React contractor?",
  "everyone I met at a hackathon",
  "who works in healthcare?",
];

interface AskNetworkProps {
  initialQuery?: string;
}

export function AskNetwork({ initialQuery = "" }: AskNetworkProps) {
  const [query, setQuery] = useState(initialQuery);
  const [pending, setPending] = useState(false);
  const [asked, setAsked] = useState<string | null>(null);
  const [state, setState] = useState<AskState | null>(null);

  // A query arriving via the URL (e.g. from a goal's "find matches") runs itself.
  const autoRan = useRef(false);
  useEffect(() => {
    if (initialQuery && !autoRan.current) {
      autoRan.current = true;
      void run(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const run = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setPending(true);
    setAsked(trimmed);
    const res = await askNetworkAction(trimmed);
    setState(res);
    setPending(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(query);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="relative">
        <MessageCircleQuestion
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Who in my network can help with…"
          className="h-12 pl-10 pr-12 text-base"
          disabled={pending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={pending || !query.trim()}
          className="absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2"
          aria-label="Ask"
        >
          {pending ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Send size={16} />
          )}
        </Button>
      </form>

      {!asked && (
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuery(example);
                void run(example);
              }}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-berry/40 hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {pending && (
          <motion.p
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 className="animate-spin" size={14} />
            Reading your network…
          </motion.p>
        )}

        {!pending && state && (
          <motion.div
            key={asked}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : (
              state.result && (
                <>
                  <p className="text-sm text-muted-foreground">
                    {state.result.answer}
                  </p>
                  <div className="space-y-3">
                    {state.result.matches.map((match, i) => (
                      <MatchCard key={match.person.id} match={match} index={i} />
                    ))}
                  </div>
                </>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MatchCard({ match, index }: { match: NetworkMatch; index: number }) {
  const subtitle = [match.person.role, match.person.company]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.07,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        href={`/people/${match.person.id}`}
        className="group flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-berry/40 hover:shadow-md motion-reduce:hover:translate-y-0"
      >
        <div className="flex items-center gap-3">
          <PersonAvatar
            name={match.person.name}
            photoUrl={match.person.photoUrl}
            size={44}
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-tight">
              {match.person.name}
            </h3>
            {subtitle && (
              <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <ArrowRight
            size={15}
            className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-berry"
          />
        </div>
        {match.reason && (
          <p className="text-sm text-foreground/80">{match.reason}</p>
        )}
        {match.opener && (
          <p className="rounded-lg bg-muted/70 px-3 py-2 text-sm italic text-muted-foreground">
            “{match.opener}”
          </p>
        )}
      </Link>
    </motion.div>
  );
}
