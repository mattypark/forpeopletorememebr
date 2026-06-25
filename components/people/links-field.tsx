"use client";

import { useState, type KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { detectLink, normalizeUrl } from "@/lib/people/links";

interface LinksFieldProps {
  value: string[];
  onChange: (links: string[]) => void;
}

export function LinksField({ value, onChange }: LinksFieldProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addLink = () => {
    const normalized = normalizeUrl(draft);
    if (!normalized) {
      setError("Enter a valid URL");
      return;
    }
    if (value.includes(normalized)) {
      setDraft("");
      return;
    }
    onChange([...value, normalized]);
    setDraft("");
    setError(null);
  };

  const removeLink = (url: string) => onChange(value.filter((l) => l !== url));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLink();
    }
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((url) => {
            const link = detectLink(url);
            return (
              <li
                key={url}
                className="flex items-center justify-between gap-2 rounded-md border border-input px-3 py-1.5 text-sm"
              >
                <span className="truncate">
                  <span className="font-medium text-foreground">
                    {link.platform}
                  </span>
                  <span className="ml-2 text-muted-foreground">{link.handle}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeLink(url)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-foreground/10"
                  aria-label={`Remove ${url}`}
                >
                  <X size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="github.com/handle, linkedin.com/in/…"
        />
        <Button type="button" variant="outline" size="icon" onClick={addLink}>
          <Plus size={16} />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
