import { z } from "zod";

/**
 * A person row as stored in Postgres. `photoUrl` is a transient, render-time
 * signed URL derived from `photoPath` — it is never persisted.
 */
export interface Person {
  id: string;
  userId: string;
  name: string;
  role: string | null;
  company: string | null;
  location: string | null;
  needs: string | null;
  notes: string | null;
  metContext: string | null;
  metAt: string | null;
  tags: string[];
  links: string[];
  photoPath: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v ? v : null));

/** Validates form input on both client and server (server action boundary). */
export const personInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  role: optionalText,
  company: optionalText,
  location: optionalText,
  needs: optionalText,
  notes: optionalText,
  metContext: optionalText,
  metAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  tags: z.array(z.string().trim().min(1)).max(50).default([]),
  links: z.array(z.string().trim().url("Enter a valid URL")).max(50).default([]),
  photoPath: z.string().trim().max(500).nullable().default(null),
});

export type PersonInput = z.infer<typeof personInputSchema>;

/**
 * Form-shaped schema (no transforms): input and output both equal
 * PersonFormValues, so it satisfies react-hook-form's resolver typing. The
 * server re-validates with `personInputSchema`, which coerces to storage shape.
 */
export const personFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  role: z.string().max(2000),
  company: z.string().max(2000),
  location: z.string().max(2000),
  needs: z.string().max(2000),
  notes: z.string().max(2000),
  metContext: z.string().max(2000),
  metAt: z.union([
    z.literal(""),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  ]),
  tags: z.array(z.string()),
  links: z.array(z.string()),
  photoPath: z.string().nullable(),
});

/** Shape used by the react-hook-form form (strings, never null, for inputs). */
export interface PersonFormValues {
  name: string;
  role: string;
  company: string;
  location: string;
  needs: string;
  notes: string;
  metContext: string;
  metAt: string;
  tags: string[];
  links: string[];
  photoPath: string | null;
}

export function toFormValues(person?: Person | null): PersonFormValues {
  return {
    name: person?.name ?? "",
    role: person?.role ?? "",
    company: person?.company ?? "",
    location: person?.location ?? "",
    needs: person?.needs ?? "",
    notes: person?.notes ?? "",
    metContext: person?.metContext ?? "",
    metAt: person?.metAt ?? "",
    tags: person?.tags ?? [],
    links: person?.links ?? [],
    photoPath: person?.photoPath ?? null,
  };
}
