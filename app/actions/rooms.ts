"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString, getNumber } from "@/lib/data";

const roomsPath = (pid: string) => `/projects/${pid}/rooms`;

export async function upsertRoom(
  projectId: string,
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    name: getString(formData, "name"),
    area: getNumber(formData, "area"),
    status: getString(formData, "status", "NOT_STARTED"),
    concept_description: getString(formData, "concept_description"),
    notes: getString(formData, "notes"),
    budget_planned: getNumber(formData, "budget_planned"),
  };

  const name = payload.name;
  if (!name) return { error: "Nazwa pokoju jest wymagana." };

  const { error } = id
    ? await supabase.from("rooms").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("rooms").insert(payload);

  if (error) return { error: error.message };
  revalidatePath(roomsPath(projectId));
  return null;
}

export async function deleteRoom(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase.from("rooms").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(roomsPath(projectId));
}
