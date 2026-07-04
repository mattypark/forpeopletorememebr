"use client";

import { motion } from "framer-motion";
import type { MetBucket } from "@/lib/people/stats";

export function MetChart({ data }: { data: MetBucket[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="kicker">
        Met over time
      </p>
      <div className="mt-4 flex h-32 items-end gap-3">
        {data.map((bucket, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <motion.div
                className="w-full rounded-t-md bg-berry/80"
                initial={{ height: 0 }}
                animate={{ height: `${(bucket.count / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
                style={{ minHeight: bucket.count > 0 ? 4 : 0 }}
                title={`${bucket.count}`}
              />
            </div>
            <span className="text-xs text-muted-foreground">{bucket.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
