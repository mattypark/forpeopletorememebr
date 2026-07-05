import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PersonForm } from "@/components/people/person-form";
import type { PersonFormValues } from "@/lib/people/types";

const DRAFT_STRING_FIELDS = [
  "name",
  "role",
  "company",
  "location",
  "email",
  "phone",
  "needs",
  "notes",
  "metContext",
  "metAt",
] as const;

/** Parse the agent's researched draft handed over via ?draft= (JSON). */
function parseDraft(raw: string | undefined): Partial<PersonFormValues> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const draft: Partial<PersonFormValues> = {};
    for (const key of DRAFT_STRING_FIELDS) {
      if (typeof parsed[key] === "string" && parsed[key]) {
        draft[key] = (parsed[key] as string).slice(0, 2000);
      }
    }
    if (Array.isArray(parsed.tags)) {
      draft.tags = parsed.tags
        .filter((t): t is string => typeof t === "string")
        .slice(0, 12);
    }
    if (Array.isArray(parsed.links)) {
      draft.links = parsed.links
        .filter(
          (l): l is string => typeof l === "string" && /^https?:\/\//.test(l),
        )
        .slice(0, 12);
    }
    return Object.keys(draft).length > 0 ? draft : null;
  } catch {
    return null;
  }
}

export default async function NewPersonPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const params = await searchParams;
  const draft = parseDraft(params.draft);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/people"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back
      </Link>
      <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        Add a person
      </h1>
      {draft && (
        <p className="rounded-lg border border-berry/25 bg-berry/5 px-3 py-2 text-sm text-muted-foreground">
          Pre-filled from the agent&apos;s research — double-check before saving.
        </p>
      )}
      <PersonForm initial={draft} />
    </div>
  );
}
