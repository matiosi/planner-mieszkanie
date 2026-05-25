"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString, getBool } from "@/lib/data";

const path = (pid: string) => `/projects/${pid}/decisions`;

export async function upsertDecision(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    room_id: getString(formData, "room_id") || null,
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    status: getString(formData, "status", "NOT_STARTED"),
    selected_option: getString(formData, "selected_option"),
    notes: getString(formData, "notes"),
    requires_approval: getBool(formData, "requires_approval"),
  };
  const { error } = id
    ? await supabase.from("decisions").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("decisions").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}

export async function deleteDecision(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase.from("decisions").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}
