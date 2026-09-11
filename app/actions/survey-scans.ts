"use server";

import { revalidatePath } from "next/cache";
import { getString, requireProject } from "@/lib/data";
import { IMAGE_UPLOAD_POLICY, assertUpload, safeStoragePath } from "@/lib/security";

const briefPath = (projectId: string) => `/projects/${projectId}/inspirations/designer-brief`;
const MAX_SCANS_PER_UPLOAD = 5;

function titleForScan(baseTitle: string, fileName: string, index: number, total: number) {
  if (baseTitle) return total > 1 ? `${baseTitle} — strona ${index + 1}` : baseTitle;
  const nameWithoutExtension = fileName.replace(/\.[^.]+$/, "").trim();
  return nameWithoutExtension || `Ankieta — strona ${index + 1}`;
}

export async function uploadSurveyScan(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (!files.length) throw new Error("Wybierz co najmniej jedno zdjęcie ankiety.");
  if (files.length > MAX_SCANS_PER_UPLOAD) {
    throw new Error(`Możesz dodać maksymalnie ${MAX_SCANS_PER_UPLOAD} zdjęć naraz.`);
  }
  files.forEach((file) => assertUpload(file, IMAGE_UPLOAD_POLICY));

  const storageBucket = "survey-scans";
  const roomId = getString(formData, "room_id") || null;
  const baseTitle = getString(formData, "title");
  const uploadedPaths: string[] = [];

  try {
    const rows = [];
    for (const [index, file] of files.entries()) {
      const storagePath = safeStoragePath(user.id, projectId, "survey-scans", file.type);
      const { error: uploadError } = await supabase.storage
        .from(storageBucket)
        .upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      uploadedPaths.push(storagePath);
      rows.push({
        project_id: projectId,
        room_id: roomId,
        title: titleForScan(baseTitle, file.name, index, files.length),
        storage_bucket: storageBucket,
        storage_path: storagePath,
        mime_type: file.type,
        original_file_name: file.name,
      });
    }

    const { error } = await supabase.from("survey_scans").insert(rows);
    if (error) throw new Error(error.message);
  } catch (error) {
    if (uploadedPaths.length) await supabase.storage.from(storageBucket).remove(uploadedPaths);
    throw error;
  }

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
