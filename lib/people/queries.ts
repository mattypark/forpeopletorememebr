import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Person, SocialStats } from "./types";

const AVATAR_BUCKET = "avatars";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

interface PersonRow {
  id: string;
  user_id: string;
  name: string;
  role: string | null;
  company: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  needs: string | null;
  notes: string | null;
  met_context: string | null;
  met_at: string | null;
  times_met: number | null;
  met_place: string | null;
  met_lat: number | null;
  met_lng: number | null;
  social_stats: SocialStats | null;
  tags: string[] | null;
  links: string[] | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: PersonRow, photoUrl: string | null): Person {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    role: row.role,
    company: row.company,
    location: row.location,
    email: row.email,
    phone: row.phone,
    needs: row.needs,
    notes: row.notes,
    metContext: row.met_context,
    metAt: row.met_at,
    timesMet: row.times_met ?? 1,
    metPlace: row.met_place,
    metLat: row.met_lat,
    metLng: row.met_lng,
    socialStats: row.social_stats ?? {},
    tags: row.tags ?? [],
    links: row.links ?? [],
    photoPath: row.photo_path,
    photoUrl,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Resolves signed URLs for a set of storage paths in a single round-trip.
 * Returns a path -> url map; failed paths are simply omitted.
 */
async function signAvatarUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(paths)];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrls(unique, SIGNED_URL_TTL);

  if (error || !data) return new Map();

  const map = new Map<string, string>();
  for (const item of data) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
  }
  return map;
}

export async function getPeople(): Promise<Person[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("people")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load people: ${error.message}`);
  const rows = (data ?? []) as PersonRow[];

  const urlMap = await signAvatarUrls(
    supabase,
    rows.map((r) => r.photo_path).filter((p): p is string => Boolean(p)),
  );

  return rows.map((row) =>
    mapRow(row, row.photo_path ? (urlMap.get(row.photo_path) ?? null) : null),
  );
}

export async function getPerson(id: string): Promise<Person | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load person: ${error.message}`);
  if (!data) return null;

  const row = data as PersonRow;
  const urlMap = row.photo_path
    ? await signAvatarUrls(supabase, [row.photo_path])
    : new Map<string, string>();

  return mapRow(row, row.photo_path ? (urlMap.get(row.photo_path) ?? null) : null);
}
