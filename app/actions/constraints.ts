"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString } from "@/lib/data";

export async function upsertConstraint(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = formData.get("id") as string | null;

  const payload = {
    project_id: projectId,
    type: getString(formData, "type", "MUST_HAVE"),
    description: getString(formData, "description") ?? "",
    room_id: getString(formData, "room_id") || null,
  };

  if (id) {
    const { error } = await supabase.from("project_constraints").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("project_constraints").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}/constraints`);
}

export async function deleteConstraint(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = formData.get("id") as string;
  const { error } = await supabase.from("project_constraints").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/constraints`);
}
