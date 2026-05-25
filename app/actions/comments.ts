"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString } from "@/lib/data";

export async function createComment(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const body = getString(formData, "body")?.trim();
  const entityType = getString(formData, "entity_type") ?? "";
  const entityId = getString(formData, "entity_id") ?? "";

  if (!body) return;

  const { error } = await supabase.from("comments").insert({
    project_id: projectId,
    entity_type: entityType,
    entity_id: entityId,
    body,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteComment(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = formData.get("id") as string;
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}
