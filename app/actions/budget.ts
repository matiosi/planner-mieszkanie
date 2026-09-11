"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString, getNumber, getBool } from "@/lib/data";
import { logActivity } from "@/lib/activity";

const path = (pid: string) => `/projects/${pid}/budget`;

export async function upsertBudgetItem(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    room_id: getString(formData, "room_id") || null,
    scenario_id: getString(formData, "scenario_id") || null,
    name: getString(formData, "name"),
    category: getString(formData, "category", "OTHER"),
    planned_cost: getNumber(formData, "planned_cost"),
    actual_cost: getNumber(formData, "actual_cost"),
    status: getString(formData, "status", "PLANNED"),
    notes: getString(formData, "notes"),
    unexpected_cost: getBool(formData, "unexpected_cost"),
  };
  const { data, error } = id
    ? await supabase.from("budget_items").update(payload).eq("id", id).eq("project_id", projectId).select("id").single()
    : await supabase.from("budget_items").insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  await logActivity(supabase, {
    projectId,
    userId: user.id,
    entityType: "budget_item",
    entityId: data?.id ?? id,
    action: id ? "updated" : "created",
    description: id ? `Edytowano pozycję budżetu: "${payload.name}"` : `Dodano pozycję budżetu: "${payload.name}"`,
  });
  revalidatePath(path(projectId));
  revalidatePath(`/projects/${projectId}/activity`);
}

export async function deleteBudgetItem(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { data: budgetItem } = await supabase.from("budget_items").select("name").eq("id", id).eq("project_id", projectId).single();
  const { error } = await supabase.from("budget_items").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  await logActivity(supabase, {
    projectId,
    userId: user.id,
    entityType: "budget_item",
    entityId: id,
    action: "deleted",
    description: `Usunięto pozycję budżetu: "${budgetItem?.name ?? id}"`,
  });
  revalidatePath(path(projectId));
  revalidatePath(`/projects/${projectId}/activity`);
}
