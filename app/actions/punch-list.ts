"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getString } from "@/lib/data";

export async function upsertPunchListItem(projectId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser();

  const id = getString(formData, "id", "");
  const title = getString(formData, "title");
  const description = getString(formData, "description", "");
  const severity = getString(formData, "severity", "MEDIUM");
  const status = getString(formData, "status", "NEW");
  const roomId = getString(formData, "room_id", "");
  const vendorId = getString(formData, "vendor_id", "");
  const dueDate = getString(formData, "due_date", "");
  const notes = getString(formData, "notes", "");

  if (!title) throw new Error("Tytuł jest wymagany");

  const payload = {
    project_id: projectId,
    title,
    description: description || null,
    severity,
    status,
    room_id: roomId || null,
    vendor_id: vendorId || null,
    due_date: dueDate || null,
    notes: notes || null,
  };

  if (id) {
    const { error } = await supabase.from("punch_list_items").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("punch_list_items").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}/punch-list`);
}

export async function deletePunchListItem(projectId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser();

  const id = getString(formData, "id");
  if (!id) throw new Error("ID jest wymagane");

  const { error } = await supabase.from("punch_list_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/punch-list`);
}
