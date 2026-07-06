"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Pricing step shown at the end of onboarding — NOT WIRED YET.
 * Stripe checkout lands later; until then `SHOW_PAYWALL` in
 * onboarding-flow.tsx stays false and this component is never rendered.
 * Keep the plan copy here so turning it on is a one-line change.
 */
interface Plan {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "For remembering the people who matter most.",
    features: ["Up to 50 people", "Tags & search", "Manual notes"],
    highlighted: false,
    cta: "Continue free",
  },
  {
    name: "Bery Pro",
    price: "$6",
    period: "per month",
    tagline: "For people whose network is their edge.",
    features: [
      "Unlimited people",
      "AI intake & enrichment",
      "Ask your network anything",
      "Map, goals & follower stats",
    ],
    highlighted: true,
    cta: "Start Pro",
  },
];

export function PaywallStep({ onContinueFree }: { onContinueFree: () => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="kicker">One last thing</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Choose how you remember.
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "flex flex-col gap-4 rounded-2xl border p-5",
              plan.highlighted ? "border-berry bg-berry/5" : "border-border bg-card",
            )}
          >
            <div>
              <p className="text-sm font-medium">{plan.name}</p>
              <p className="mt-1 font-serif text-3xl font-semibold">
                {plan.price}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {plan.period}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>
            </div>
            <ul className="flex flex-1 flex-col gap-1.5 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check size={14} className="shrink-0 text-berry" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.highlighted ? "default" : "outline"}
              onClick={onContinueFree}
              // TODO(stripe): highlighted plan opens Stripe checkout instead.
            >
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
