"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { personInputSchema, type PersonInput } from "./types";
import { enrichPerson, type EnrichSuggestion } from "./enrich";
import {
  researchPerson,
  type ResearchMessage,
  type ResearchResult,
} from "./research";

const AVATAR_BUCKET = "avatars";

interface ActionState {
  error: string | null;
}

async function requireUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string> {
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/auth/login");
  return userId as string;
}

function toRow(input: PersonInput) {
  return {
    name: input.name,
    role: input.role,
    company: input.company,
    location: input.location,
    email: input.email,
    phone: input.phone,
    needs: input.needs,
    notes: input.notes,
    met_context: input.metContext,
    met_at: input.metAt,
    tags: input.tags,
    links: input.links,
    photo_path: input.photoPath,
  };
}

export async function createPerson(input: unknown): Promise<ActionState> {
  const parsed = personInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const userId = await requireUserId(supabase);

  const { data, error } = await supabase
    .from("people")
    .insert({ ...toRow(parsed.data), user_id: userId })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/people");
  redirect(`/people/${data.id}`);
}

export async function updatePerson(
  id: string,
  input: unknown,
): Promise<ActionState> {
  const parsed = personInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  await requireUserId(supabase);

  const { error } = await supabase
    .from("people")
    .update(toRow(parsed.data))
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/people");
  revalidatePath(`/people/${id}`);
  redirect(`/people/${id}`);
}

export interface EnrichState {
  error: string | null;
  suggestion: EnrichSuggestion | null;
}

export async function enrichPersonAction(input: {
  name: string;
  company?: string;
  role?: string;
  links?: string[];
}): Promise<EnrichState> {
  const name = input?.name?.trim();
  if (!name) return { error: "Add a name first.", suggestion: null };

  const supabase = await createClient();
  await requireUserId(supabase);

  try {
    const suggestion = await enrichPerson({
      name,
      company: input.company?.trim() || undefined,
      role: input.role?.trim() || undefined,
      links: input.links ?? [],
    });
    return { error: null, suggestion };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Enrichment failed",
      suggestion: null,
    };
  }
}

export interface ResearchState extends ResearchResult {
  error: string | null;
}

export async function researchChatAction(
  messages: ResearchMessage[],
): Promise<ResearchState> {
  const supabase = await createClient();
  await requireUserId(supabase);

  if (!Array.isArray(messages) || messages.length === 0) {
    return { reply: "", draft: null, sources: [], error: "Say something to start." };
  }

  try {
    const result = await researchPerson(messages.slice(-12));
    return { ...result, error: null };
  } catch (err) {
    return {
      reply: "",
      draft: null,
      sources: [],
      error: err instanceof Error ? err.message : "Research failed",
    };
  }
}

export async function deletePerson(id: string): Promise<void> {
  const supabase = await createClient();
  await requireUserId(supabase);

  // Look up the photo path first so we can clean up storage after the row is gone.
  const { data: row } = await supabase
    .from("people")
    .select("photo_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) throw new Error(error.message);

  const photoPath = (row as { photo_path: string | null } | null)?.photo_path;
  if (photoPath) {
    await supabase.storage.from(AVATAR_BUCKET).remove([photoPath]);
  }

  revalidatePath("/people");
  redirect("/people");
}
