"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getString } from "@/lib/data";
import { IMAGE_UPLOAD_POLICY, assertUpload, safeStoragePath } from "@/lib/security";

export async function upsertPunchListItem(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { user } = await requireUser();

  const id = getString(formData, "id", "");
  const title = getString(formData, "title");
  const description = getString(formData, "description", "");
  const severity = getString(formData, "severity", "MEDIUM");
  const status = getString(formData, "status", "NEW");
  const roomId = getString(formData, "room_id", "");
  const vendorId = getString(formData, "vendor_id", "");
  const dueDate = getString(formData, "due_date", "");
  const notes = getString(formData, "notes", "");
  const acceptancePhase = getString(formData, "acceptance_phase", "FINAL");
  const file = formData.get("photo") as File | null;

  if (!title) throw new Error("Tytuł jest wymagany");

  let photoBucket: string | null = null;
  let photoPath: string | null = null;
  if (file && file.size > 0) {
    assertUpload(file, IMAGE_UPLOAD_POLICY);
    photoBucket = "punch-list";
    photoPath = safeStoragePath(user.id, projectId, "punch-list", file.type);
    const bytes = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(photoBucket)
      .upload(photoPath, bytes, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);
  }

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
    acceptance_phase: acceptancePhase,
    ...(photoBucket && photoPath ? { photo_bucket: photoBucket, photo_path: photoPath } : {}),
  };

  if (id) {
    const { error } = await supabase.from("punch_list_items").update(payload).eq("id", id).eq("project_id", projectId);
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

  const { data: item } = await supabase
    .from("punch_list_items")
    .select("photo_bucket,photo_path")
    .eq("id", id)
    .eq("project_id", projectId)
    .maybeSingle();
  if (item?.photo_bucket && item.photo_path) {
    await supabase.storage.from(item.photo_bucket).remove([item.photo_path]);
  }

  const { error } = await supabase.from("punch_list_items").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/punch-list`);
}
