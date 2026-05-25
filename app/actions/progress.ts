"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getString } from "@/lib/data";

export async function uploadProgressPhoto(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { user } = await requireUser();

  const title = getString(formData, "title", "");
  const note = getString(formData, "note", "");
  const roomId = getString(formData, "room_id", "");
  const photoDate = getString(formData, "photo_date", new Date().toISOString().split("T")[0]);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Zdjęcie jest wymagane");

  const ext = file.name.split(".").pop() ?? "jpg";
  const uuid = crypto.randomUUID();
  const storagePath = `users/${user.id}/projects/${projectId}/progress/${uuid}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("progress-photos")
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase.from("progress_photos").insert({
    project_id: projectId,
    room_id: roomId || null,
    storage_bucket: "progress-photos",
    storage_path: storagePath,
    title: title || null,
    note: note || null,
    photo_date: photoDate,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/progress`);
}

export async function deleteProgressPhoto(projectId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser();

  const id = getString(formData, "id");
  if (!id) throw new Error("ID jest wymagane");

  const { data: photo } = await supabase
    .from("progress_photos")
    .select("storage_bucket,storage_path")
    .eq("id", id)
    .single();

  if (photo?.storage_bucket && photo?.storage_path) {
    await supabase.storage.from(photo.storage_bucket).remove([photo.storage_path]);
  }

  const { error } = await supabase.from("progress_photos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/progress`);
}
