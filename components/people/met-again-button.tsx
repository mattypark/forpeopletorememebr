"use client";

import { useState, useTransition } from "react";
import { Handshake, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { metAgainAction } from "@/lib/people/actions";

/** One-tap counter bump for "I ran into them again". */
export function MetAgainButton({ id, timesMet }: { id: string; timesMet: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await metAgainAction(id);
            if (res.error) setError(res.error);
          })
        }
      >
        {pending ? (
          <Loader2 className="mr-1.5 animate-spin" size={14} />
        ) : (
          <Handshake className="mr-1.5" size={14} />
        )}
        Met again · {timesMet}×
      </Button>
      {error && <p className="max-w-48 text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
