"use server";

import { revalidatePath } from "next/cache";
import { requireProjectWrite, getString } from "@/lib/data";

const path = (projectId: string) => `/projects/${projectId}/budget/scenarios`;

export async function upsertBudgetScenario(projectId: string, formData: FormData) {
  const { supabase } = await requireProjectWrite(projectId);
  const id = getString(formData, "id");
  const isActive = formData.get("is_active") === "on";
  if (isActive) {
    await supabase.from("budget_scenarios").update({ is_active: false }).eq("project_id", projectId);
  }
  const payload = {
    project_id: projectId,
    name: getString(formData, "name"),
    is_active: isActive,
  };
  const { error } = id
    ? await supabase.from("budget_scenarios").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("budget_scenarios").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
  revalidatePath(`/projects/${projectId}/budget`);
}

export async function deleteBudgetScenario(projectId: string, formData: FormData) {
  const { supabase } = await requireProjectWrite(projectId);
  const id = getString(formData, "id");
  await supabase.from("budget_items").update({ scenario_id: null }).eq("project_id", projectId).eq("scenario_id", id);
  const { error } = await supabase.from("budget_scenarios").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}
