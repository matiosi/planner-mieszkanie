"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getString, getNumber } from "@/lib/data";

export async function upsertScheduleItem(projectId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser();

  const id = getString(formData, "id", "");
  const title = getString(formData, "title");
  const description = getString(formData, "description", "");
  const startDate = getString(formData, "start_date", "");
  const endDate = getString(formData, "end_date", "");
  const status = getString(formData, "status", "PLANNED");
  const roomId = getString(formData, "room_id", "");
  const vendorId = getString(formData, "vendor_id", "");
  const notes = getString(formData, "notes", "");

  if (!title) throw new Error("Tytuł jest wymagany");

  const payload = {
    project_id: projectId,
    title,
    description: description || null,
    start_date: startDate || null,
    end_date: endDate || null,
    status,
    room_id: roomId || null,
    vendor_id: vendorId || null,
    notes: notes || null,
  };

  if (id) {
    const { error } = await supabase.from("schedule_items").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("schedule_items").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}/schedule`);
}

export async function deleteScheduleItem(projectId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser();

  const id = getString(formData, "id");
  if (!id) throw new Error("ID jest wymagane");

  const { error } = await supabase.from("schedule_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/schedule`);
}
