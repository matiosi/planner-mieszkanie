import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return { supabase, user };
}

export async function requireProject(projectId: string) {
  const { supabase, user } = await requireUser();
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();

  if (error || !project) notFound();
  return { supabase, user, project };
}

export async function getRooms(projectId: string) {
  const { supabase } = await requireProject(projectId);
  const { data } = await supabase.from("rooms").select("*").eq("project_id", projectId).order("created_at");
  return data ?? [];
}

export async function getDashboard(projectId: string) {
  const { supabase, project } = await requireProject(projectId);
  const [rooms, budget, tasks, decisions, products, vendors, inspirations, differences] = await Promise.all([
    supabase.from("rooms").select("*").eq("project_id", projectId),
    supabase.from("budget_items").select("*").eq("project_id", projectId),
    supabase.from("tasks").select("*").eq("project_id", projectId),
    supabase.from("decisions").select("*").eq("project_id", projectId),
    supabase.from("products").select("*").eq("project_id", projectId),
    supabase.from("vendors").select("*").eq("project_id", projectId),
    supabase.from("inspirations").select("*").eq("project_id", projectId),
    supabase.from("plan_differences").select("*").eq("project_id", projectId)
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
    differences: differences.data ?? []
  };
}

export async function signedUrl(bucket?: string | null, path?: string | null) {
  if (!bucket || !path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export function getNumber(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").replace(",", ".");
  return value === "" ? null : Number(value);
}

export function getString(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}
