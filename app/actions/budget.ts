"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString, getNumber, getBool } from "@/lib/data";

const path = (pid: string) => `/projects/${pid}/budget`;

export async function upsertBudgetItem(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    room_id: getString(formData, "room_id") || null,
    name: getString(formData, "name"),
    category: getString(formData, "category", "OTHER"),
    planned_cost: getNumber(formData, "planned_cost"),
    actual_cost: getNumber(formData, "actual_cost"),
    status: getString(formData, "status", "PLANNED"),
    notes: getString(formData, "notes"),
    unexpected_cost: getBool(formData, "unexpected_cost"),
  };
  const { error } = id
    ? await supabase.from("budget_items").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("budget_items").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}

export async function deleteBudgetItem(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase.from("budget_items").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}
