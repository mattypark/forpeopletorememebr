"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { refreshSocialStatsAction } from "@/lib/people/actions";

/** Refreshes follower/content stats for everyone on the current network page. */
export function RefreshStatsButton({ personIds }: { personIds: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      <Button
        variant="outline"
        size="sm"
        disabled={pending || personIds.length === 0}
        onClick={() =>
          startTransition(async () => {
            setNote(null);
            let failed = 0;
            // Sequential on purpose — stays friendly to the scraper sidecar.
            for (const id of personIds) {
              const res = await refreshSocialStatsAction(id);
              if (res.error) failed += 1;
            }
            setNote(
              failed === 0
                ? "Stats refreshed."
                : `Refreshed with ${failed} failure${failed > 1 ? "s" : ""}.`,
            );
            router.refresh();
          })
        }
      >
        {pending ? (
          <Loader2 className="mr-1.5 animate-spin" size={14} />
        ) : (
          <RefreshCw className="mr-1.5" size={14} />
        )}
        {pending ? "Refreshing…" : "Refresh stats"}
      </Button>
    </div>
  );
}
