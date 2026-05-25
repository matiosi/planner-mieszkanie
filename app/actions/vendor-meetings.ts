"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString } from "@/lib/data";

export async function upsertVendorMeeting(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = formData.get("id") as string | null;

  const payload = {
    project_id: projectId,
    vendor_id: getString(formData, "vendor_id") || null,
    title: getString(formData, "title") ?? "",
    meeting_date: getString(formData, "meeting_date") || null,
    notes: getString(formData, "notes") || null,
    outcome: getString(formData, "outcome") || null,
    next_steps: getString(formData, "next_steps") || null,
  };

  if (id) {
    const { error } = await supabase.from("vendor_meetings").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("vendor_meetings").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}/vendors`);
}

export async function deleteVendorMeeting(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = formData.get("id") as string;
  const { error } = await supabase.from("vendor_meetings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/vendors`);
}
