"use server";

import { revalidatePath } from "next/cache";
import { getString, requireProject } from "@/lib/data";
import { IMAGE_UPLOAD_POLICY, assertUpload, safeStoragePath } from "@/lib/security";

const briefPath = (projectId: string) => `/projects/${projectId}/inspirations/designer-brief`;

export async function uploadSurveyScan(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Wybierz zdjęcie ankiety.");
  assertUpload(file, IMAGE_UPLOAD_POLICY);

  const storageBucket = "survey-scans";
  const storagePath = safeStoragePath(user.id, projectId, "survey-scans", file.type);
  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase.from("survey_scans").insert({
    project_id: projectId,
    room_id: getString(formData, "room_id") || null,
    title: getString(formData, "title") || "Ankieta",
    storage_bucket: storageBucket,
    storage_path: storagePath,
    mime_type: file.type,
    original_file_name: file.name,
  });
  if (error) throw new Error(error.message);

  revalidatePath(briefPath(projectId));
}

export async function deleteSurveyScan(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { data } = await supabase
    .from("survey_scans")
    .select("storage_bucket,storage_path")
    .eq("id", id)
    .eq("project_id", projectId)
    .single();

  if (data?.storage_bucket && data.storage_path) {
    await supabase.storage.from(data.storage_bucket).remove([data.storage_path]);
  }

  const { error } = await supabase
    .from("survey_scans")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);

  revalidatePath(briefPath(projectId));
}
