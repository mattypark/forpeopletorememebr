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
import { askNetwork, type AskResult } from "./ask";
import { intakePerson, type IntakeResult } from "./agent";
import { getPeople } from "./queries";

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

export interface IntakeState {
  result: IntakeResult | null;
  error: string | null;
}

/**
 * Web-research a described person (Gemini grounding + Scrapling sidecar) and
 * return a draft ready to pour into the Add Person form.
 */
export async function intakePersonAction(
  description: string,
): Promise<IntakeState> {
  const trimmed =
    typeof description === "string" ? description.trim().slice(0, 1000) : "";
  if (!trimmed) {
    return { result: null, error: "Describe the person first." };
  }

  const supabase = await createClient();
  await requireUserId(supabase);

  try {
    const result = await intakePerson(trimmed);
    return { result, error: null };
  } catch (err) {
    return {
      result: null,
      error: err instanceof Error ? err.message : "Research failed",
    };
  }
}

export interface AskState {
  result: AskResult | null;
  error: string | null;
}

/** Intent search: rank the user's own people against a need or question. */
export async function askNetworkAction(query: string): Promise<AskState> {
  const trimmed = typeof query === "string" ? query.trim().slice(0, 500) : "";
  if (!trimmed) return { result: null, error: "Ask something first." };

  const supabase = await createClient();
  await requireUserId(supabase);

  try {
    const people = await getPeople();
    const result = await askNetwork(trimmed, people);
    return { result, error: null };
  } catch (err) {
    return {
      result: null,
      error: err instanceof Error ? err.message : "Search failed",
    };
  }
}

const GOAL_TITLE_MAX = 200;
const GOAL_DETAILS_MAX = 1000;

export async function createGoal(input: {
  title: string;
  details?: string;
}): Promise<ActionState> {
  const title = input?.title?.trim().slice(0, GOAL_TITLE_MAX);
  if (!title) return { error: "Give the goal a title." };
  const details = input.details?.trim().slice(0, GOAL_DETAILS_MAX) || null;

  const supabase = await createClient();
  const userId = await requireUserId(supabase);

  const { error } = await supabase
    .from("goals")
    .insert({ title, details, user_id: userId });

  if (error) {
    if (error.code === "42P01") {
      return { error: "Goals table missing — run supabase/migrations/0003_goals.sql first." };
    }
    return { error: error.message };
  }

  revalidatePath("/people/goals");
  revalidatePath("/people");
  return { error: null };
}

export async function setGoalStatus(
  id: string,
  status: "active" | "done",
): Promise<ActionState> {
  const supabase = await createClient();
  await requireUserId(supabase);

  const { error } = await supabase.from("goals").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/people/goals");
  revalidatePath("/people");
  return { error: null };
}

export async function deleteGoal(id: string): Promise<ActionState> {
  const supabase = await createClient();
  await requireUserId(supabase);

  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/people/goals");
  revalidatePath("/people");
  return { error: null };
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
