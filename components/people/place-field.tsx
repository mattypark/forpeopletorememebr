"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import { suggestPlacesAction } from "@/lib/people/actions";
import type { PlaceSuggestion } from "@/lib/people/geocode";

const DEBOUNCE_MS = 350;
const MIN_CHARS = 3;

interface PlaceFieldProps {
  value: string;
  /** Fired on typing (coords cleared) and on picking a suggestion (coords set). */
  onChange: (place: string, lat: number | null, lng: number | null) => void;
  placeholder?: string;
}

/**
 * "Where we met" input with address autocomplete (OpenStreetMap Nominatim).
 * Picking a suggestion stores exact coordinates with the form, so the person
 * lands on the map at the precise venue, not a city-level guess.
 */
export function PlaceField({ value, onChange, placeholder }: PlaceFieldProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const skipNextFetch = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    if (value.trim().length < MIN_CHARS) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await suggestPlacesAction(value);
        setSuggestions(results);
        setOpen(results.length > 0);
        setHighlight(-1);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function pick(s: PlaceSuggestion) {
    skipNextFetch.current = true;
    onChange(s.label, s.lat, s.lng);
    setSuggestions([]);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      pick(suggestions[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value, null, null)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        )}
      </div>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg"
        >
          {suggestions.map((s, i) => {
            const [name, ...rest] = s.label.split(", ");
            return (
              <li key={`${s.lat},${s.lng}`} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(s)}
                  className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    i === highlight ? "bg-foreground/5" : ""
                  }`}
                >
                  <MapPin size={14} className="mt-0.5 shrink-0 text-berry" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{name}</span>
                    {rest.length > 0 && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {rest.join(", ")}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
