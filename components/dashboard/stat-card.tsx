"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  accent?: boolean;
}

/**
 * Magazine-style stat: heavy top rule, small-caps label, oversized serif
 * numeral. No box — the rule is the structure.
 */
export function StatCard({ label, value, hint, accent }: StatCardProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);

  return (
    <div
      className={`border-t-2 pt-3 animate-in fade-in slide-in-from-bottom-2 duration-500 ${
        accent ? "border-berry" : "border-foreground"
      }`}
    >
      <p className="kicker">{label}</p>
      <p
        className={`mt-1.5 font-serif text-5xl font-semibold tabular-nums tracking-tight ${
          accent ? "text-berry" : ""
        }`}
      >
        {display}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
