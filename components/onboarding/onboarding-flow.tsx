"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BeryWordmark } from "@/components/bery-logo";
import {
  ONBOARDING_QUESTIONS,
  type OnboardingAnswers,
} from "@/lib/onboarding";

/*
 * NOTE(paywall): a pricing step slots in after the last question — see
 * components/onboarding/paywall-step.tsx. Disabled until Stripe lands.
 */
const SHOW_PAYWALL = false;

const TOTAL_STEPS = ONBOARDING_QUESTIONS.length + 1; // questions + final screen

export function OnboardingFlow({ firstName }: { firstName: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [saving, setSaving] = useState(false);

  const question = ONBOARDING_QUESTIONS[step];
  const isFinal = step === ONBOARDING_QUESTIONS.length;
  const selected = question ? (answers[question.id] ?? []) : [];

  const headline = useMemo(() => {
    const uses = answers.useFor ?? [];
    if (uses.length > 0) {
      return `Your ${uses[0].split(" ")[0].toLowerCase()} network is about to get a memory.`;
    }
    return "Your network is about to get a memory.";
  }, [answers.useFor]);

  async function persist(extra: Record<string, unknown>) {
    const supabase = createClient();
    await supabase.auth.updateUser({
      data: { onboarded: true, onboarding: answers, ...extra },
    });
  }

  async function finish() {
    setSaving(true);
    try {
      await persist({ onboarding_completed_at: new Date().toISOString() });
    } finally {
      router.replace("/people");
    }
  }

  async function skip() {
    setSaving(true);
    try {
      await persist({ onboarding_skipped: true });
    } finally {
      router.replace("/people");
    }
  }

  function toggle(option: string) {
    if (!question) return;
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      if (question.multi) {
        const next = current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option];
        return { ...prev, [question.id]: next };
      }
      return { ...prev, [question.id]: [option] };
    });
    // Single-choice advances on its own — one less click.
    if (!question.multi) {
      setTimeout(() => setStep((s) => s + 1), 220);
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-6">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between">
        <BeryWordmark markSize={20} />
        <button
          type="button"
          onClick={skip}
          disabled={saving}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip for now
        </button>
      </header>

      {/* progress */}
      <div className="mx-auto mt-6 flex w-full max-w-xl gap-1.5">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i <= step ? "bg-berry" : "bg-border",
            )}
          />
        ))}
      </div>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-10">
        <AnimatePresence mode="wait">
          {question && (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <p className="kicker">{question.kicker}</p>
                <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                  {question.question}
                </h1>
                {question.multi && (
                  <p className="text-sm text-muted-foreground">
                    Pick all that apply.
                  </p>
                )}
              </div>

              <div className="grid gap-2.5">
                {question.options.map((option) => {
                  const isOn = selected.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggle(option)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm transition-all duration-150",
                        isOn
                          ? "border-berry bg-berry/10 font-medium text-foreground"
                          : "border-border bg-card hover:border-foreground/30 hover:bg-foreground/5",
                      )}
                    >
                      {option}
                      {isOn && <Check size={16} className="text-berry" />}
                    </button>
                  );
                })}
              </div>

              {question.multi && (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={selected.length === 0}
                  className="w-full"
                >
                  Continue
                  <ArrowRight className="ml-1.5" size={16} />
                </Button>
              )}
            </motion.div>
          )}

          {isFinal && (
            <motion.div
              key="final"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-6 text-center"
            >
              <div className="space-y-3">
                <p className="kicker">
                  {firstName ? `You're set, ${firstName}` : "You're set"}
                </p>
                <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                  {headline}
                </h1>
                <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                  Add the last person you met — it takes 20 seconds, and it's
                  the moment Bery starts working for you.
                </p>
              </div>
              {/* NOTE(paywall): SHOW_PAYWALL gates a PaywallStep here later. */}
              {SHOW_PAYWALL ? null : null}
              <Button onClick={finish} disabled={saving} size="lg" className="w-full">
                {saving ? "Saving…" : "Start remembering"}
                <ArrowRight className="ml-1.5" size={16} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
