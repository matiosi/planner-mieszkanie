"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString, getNumber } from "@/lib/data";

const path = (pid: string) => `/projects/${pid}/vendors`;

export async function upsertVendor(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    name: getString(formData, "name"),
    type: getString(formData, "type", "OTHER"),
    phone: getString(formData, "phone"),
    email: getString(formData, "email"),
    offer_amount: getNumber(formData, "offer_amount"),
    status: getString(formData, "status", "CONTACTED"),
    notes: getString(formData, "notes"),
  };
  const { error } = id
    ? await supabase.from("vendors").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("vendors").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}

export async function deleteVendor(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase.from("vendors").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}
