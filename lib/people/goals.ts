import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface Goal {
  id: string;
  title: string;
  details: string | null;
  status: "active" | "done";
  createdAt: string;
}

interface GoalRow {
  id: string;
  title: string;
  details: string | null;
  status: string;
  created_at: string;
}

function mapRow(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    details: row.details,
    status: row.status === "done" ? "done" : "active",
    createdAt: row.created_at,
  };
}

/**
 * Loads goals, tolerating a missing table (migration 0003 not applied yet)
 * so the dashboard and goals page render instead of crashing.
 */
export async function getGoals(): Promise<{ goals: Goal[]; tableMissing: boolean }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("goals")
    .select("id, title, details, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    // 42P01 = undefined_table
    if (error.code === "42P01") return { goals: [], tableMissing: true };
    throw new Error(`Failed to load goals: ${error.message}`);
  }

  return { goals: ((data ?? []) as GoalRow[]).map(mapRow), tableMissing: false };
}

export async function getActiveGoals(): Promise<Goal[]> {
  const { goals } = await getGoals().catch(() => ({
    goals: [] as Goal[],
    tableMissing: true,
  }));
  return goals.filter((g) => g.status === "active");
}
