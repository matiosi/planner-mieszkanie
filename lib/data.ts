import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function requireProject(projectId: string) {
  const { supabase, user } = await requireUser();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id,owner_id,name,area,target_budget,style,stage,description,contingency_percent,created_at")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();
  if (error || !project) notFound();
  return { supabase, user, project };
}

export async function getRooms(projectId: string) {
  const { supabase } = await requireProject(projectId);
  const { data } = await supabase
    .from("rooms")
    .select("id,name,area,status,concept_description,notes,budget_planned,sort_order")
    .eq("project_id", projectId)
    .order("sort_order")
    .order("created_at");
  return data ?? [];
}

export async function getDashboard(projectId: string) {
  const { supabase, project } = await requireProject(projectId);
  const [rooms, budget, tasks, decisions, products, vendors, inspirations, differences] = await Promise.all([
    supabase.from("rooms").select("id,name,status").eq("project_id", projectId).order("sort_order"),
    supabase.from("budget_items").select("planned_cost,actual_cost,unexpected_cost").eq("project_id", projectId),
    supabase.from("tasks").select("id,title,status,priority,due_date").eq("project_id", projectId),
    supabase.from("decisions").select("id,status").eq("project_id", projectId),
    supabase.from("products").select("id").eq("project_id", projectId),
    supabase.from("vendors").select("id").eq("project_id", projectId),
    supabase.from("inspirations").select("id").eq("project_id", projectId),
    supabase.from("plan_differences").select("id,status,priority").eq("project_id", projectId),
  ]);
  return {
    project,
    rooms: rooms.data ?? [],
    budget: budget.data ?? [],
    tasks: tasks.data ?? [],
    decisions: decisions.data ?? [],
    products: products.data ?? [],
    vendors: vendors.data ?? [],
    inspirations: inspirations.data ?? [],
    differences: differences.data ?? [],
  };
}

export async function signedUrl(bucket?: string | null, path?: string | null): Promise<string | null> {
  if (!bucket || !path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

// Helpery do parsowania FormData
export function getString(formData: FormData, key: string, fallback = ""): string {
  return String(formData.get(key) ?? fallback).trim();
}

export function getNumber(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return isNaN(n) ? null : n;
}

export function getBool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}
