"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Plus, Sparkles, Trash2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createGoal, setGoalStatus, deleteGoal } from "@/lib/people/actions";
import type { Goal } from "@/lib/people/goals";

interface GoalsPanelProps {
  goals: Goal[];
  tableMissing: boolean;
}

export function GoalsPanel({ goals, tableMissing }: GoalsPanelProps) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = goals.filter((g) => g.status === "active");
  const done = goals.filter((g) => g.status === "done");

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || pending) return;
    setPending(true);
    setError(null);
    const res = await createGoal({ title, details });
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setTitle("");
    setDetails("");
  };

  if (tableMissing) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">One-time setup needed</p>
        <p className="mt-1">
          Goals live in a new table. Run{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            supabase/migrations/0003_goals.sql
          </code>{" "}
          against your Supabase project (SQL editor or CLI), then reload.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={add}
        className="space-y-3 rounded-xl border border-border bg-card p-4"
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you working toward? e.g. “raising a seed round”"
          disabled={pending}
        />
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Optional detail that sharpens matching — sector, stage, city…"
          rows={2}
          disabled={pending}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" disabled={pending || !title.trim()} size="sm">
          {pending ? (
            <Loader2 className="mr-1.5 animate-spin" size={14} />
          ) : (
            <Plus className="mr-1.5" size={14} />
          )}
          Add goal
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="kicker">
          Active
        </h2>
        {active.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            No active goals. Add one — Bery will surface who in your network
            can help.
          </p>
        ) : (
          <ul className="space-y-2.5">
            <AnimatePresence initial={false}>
              {active.map((goal) => (
                <GoalRow key={goal.id} goal={goal} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="kicker">
            Done
          </h2>
          <ul className="space-y-2.5">
            <AnimatePresence initial={false}>
              {done.map((goal) => (
                <GoalRow key={goal.id} goal={goal} />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}
    </div>
  );
}

function GoalRow({ goal }: { goal: Goal }) {
  const [busy, setBusy] = useState(false);
  const isDone = goal.status === "done";

  const toggle = async () => {
    setBusy(true);
    await setGoalStatus(goal.id, isDone ? "active" : "done");
    setBusy(false);
  };

  const remove = async () => {
    setBusy(true);
    await deleteGoal(goal.id);
    setBusy(false);
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border bg-card p-4",
        isDone && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-medium leading-snug",
            isDone && "line-through decoration-muted-foreground/50",
          )}
        >
          {goal.title}
        </p>
        {goal.details && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {goal.details}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!isDone && (
          <Button asChild variant="ghost" size="sm" className="text-berry hover:text-berry">
            <Link
              href={`/people/ask?q=${encodeURIComponent(`${goal.title}${goal.details ? ` — ${goal.details}` : ""}`)}`}
            >
              <Sparkles className="mr-1" size={14} />
              Find matches
            </Link>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          disabled={busy}
          aria-label={isDone ? "Reopen goal" : "Mark done"}
        >
          {isDone ? <Undo2 size={15} /> : <Check size={15} />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={remove}
          disabled={busy}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete goal"
        >
          <Trash2 size={15} />
        </Button>
      </div>
    </motion.li>
  );
}
