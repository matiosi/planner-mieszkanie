"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getString, getNumber } from "@/lib/data";

export async function upsertMeasurement(projectId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser();

  const id = getString(formData, "id", "");
  const name = getString(formData, "name");
  const value = getNumber(formData, "value");
  const unit = getString(formData, "unit", "cm");
  const roomId = getString(formData, "room_id", "");
  const note = getString(formData, "note", "");

  if (!name) throw new Error("Nazwa jest wymagana");
  if (value === null || isNaN(value)) throw new Error("Wartość jest wymagana");

  const payload = {
    project_id: projectId,
    name,
    value,
    unit,
    room_id: roomId || null,
    note: note || null,
  };

  if (id) {
    const { error } = await supabase.from("measurements").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("measurements").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}/measurements`);
}

export async function deleteMeasurement(projectId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser();

  const id = getString(formData, "id");
  if (!id) throw new Error("ID jest wymagane");

  const { error } = await supabase.from("measurements").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/measurements`);
}
