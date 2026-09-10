import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const PROJECT_ROLES = ["OWNER", "EDITOR", "VIEWER", "DESIGNER", "CONTRACTOR"] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

const ROLE_RANK: Record<ProjectRole, number> = {
  OWNER: 100,
  EDITOR: 80,
  DESIGNER: 60,
  CONTRACTOR: 40,
  VIEWER: 10,
};

export const requireUser = cache(async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
});

export const requireProjectAccess = cache(async function requireProjectAccess(projectId: string) {
  const { supabase, user } = await requireUser();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id,owner_id,name,area,target_budget,style,stage,description,contingency_percent,created_at")
    .eq("id", projectId)
    .single();
  if (error || !project) notFound();

  if (project.owner_id === user.id) {
    return { supabase, user, project, role: "OWNER" as ProjectRole };
  }

  const { data: member } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member?.role) notFound();
  return { supabase, user, project, role: member.role as ProjectRole };
});

export async function requireProjectRole(projectId: string, allowedRoles: ProjectRole[]) {
  const ctx = await requireProjectAccess(projectId);
  if (!allowedRoles.includes(ctx.role)) notFound();
  return ctx;
}

export async function requireProjectWrite(projectId: string) {
  return requireProjectRole(projectId, ["OWNER", "EDITOR"]);
}

export async function requireProjectOwner(projectId: string) {
  return requireProjectRole(projectId, ["OWNER"]);
}

export async function requireProject(projectId: string) {
  return requireProjectAccess(projectId);
}

export function canRoleAtLeast(role: ProjectRole, minimum: ProjectRole) {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export async function getRooms(projectId: string) {
  const { supabase } = await requireProjectAccess(projectId);
  const { data } = await supabase
    .from("rooms")
    .select("id,name,area,status,concept_description,notes,budget_planned,sort_order")
    .eq("project_id", projectId)
    .order("sort_order")
    .order("created_at");
  return data ?? [];
}

export async function getDashboard(projectId: string) {
  const { supabase, project } = await requireProjectAccess(projectId);
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
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);

    if (error) {
      console.error("Nie udało się wygenerować podpisanego URL pliku.", {
        bucket,
        path,
        message: error.message,
      });
      return null;
    }

    return data?.signedUrl ?? null;
  } catch (error) {
    // A missing file or a temporary Storage failure must not prevent an entire
    // Server Component page from rendering. Callers already handle a null URL.
    console.error("Nie udało się wygenerować podpisanego URL pliku.", {
      bucket,
      path,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
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
