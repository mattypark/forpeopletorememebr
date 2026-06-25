"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  accent?: boolean;
}

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
    <div className="rounded-xl border border-border bg-card p-5 transition-colors duration-200 ease-out hover:border-foreground/15 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 font-serif text-4xl font-semibold tabular-nums ${
          accent ? "text-[#e76f51]" : ""
        }`}
      >
        {display}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
