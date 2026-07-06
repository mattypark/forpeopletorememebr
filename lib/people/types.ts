import { z } from "zod";

/** Cached per-platform social stats, refreshed on demand from network pages. */
export interface SocialPlatformStats {
  username: string;
  profileUrl: string;
  followers: number | null;
  posts: string | null;
  fetchedAt: string;
}

export type SocialStats = Partial<
  Record<"github" | "x" | "instagram" | "linkedin", SocialPlatformStats>
>;

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
  email: string | null;
  phone: string | null;
  needs: string | null;
  notes: string | null;
  metContext: string | null;
  metAt: string | null;
  timesMet: number;
  metPlace: string | null;
  metLat: number | null;
  metLng: number | null;
  socialStats: SocialStats;
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
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .or(z.literal(""))
    .optional()
    .transform((v) => (v ? v : null)),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v : null)),
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
  timesMet: z.coerce.number().int().min(1).max(10000).default(1),
  metPlace: optionalText,
  metLat: z.number().gte(-90).lte(90).nullable().default(null),
  metLng: z.number().gte(-180).lte(180).nullable().default(null),
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
  email: z.union([z.literal(""), z.string().email("Enter a valid email")]),
  phone: z.string().max(40),
  needs: z.string().max(2000),
  notes: z.string().max(2000),
  metContext: z.string().max(2000),
  metAt: z.union([
    z.literal(""),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  ]),
  timesMet: z.number().int().min(1).max(10000),
  metPlace: z.string().max(2000),
  metLat: z.number().nullable(),
  metLng: z.number().nullable(),
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
  email: string;
  phone: string;
  needs: string;
  notes: string;
  metContext: string;
  metAt: string;
  timesMet: number;
  metPlace: string;
  metLat: number | null;
  metLng: number | null;
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
    email: person?.email ?? "",
    phone: person?.phone ?? "",
    needs: person?.needs ?? "",
    notes: person?.notes ?? "",
    metContext: person?.metContext ?? "",
    metAt: person?.metAt ?? "",
    timesMet: person?.timesMet ?? 1,
    metPlace: person?.metPlace ?? "",
    metLat: person?.metLat ?? null,
    metLng: person?.metLng ?? null,
    tags: person?.tags ?? [],
    links: person?.links ?? [],
    photoPath: person?.photoPath ?? null,
  };
}
