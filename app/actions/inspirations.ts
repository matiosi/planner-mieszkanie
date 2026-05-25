"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString, getBool } from "@/lib/data";

const basePath = (pid: string) => `/projects/${pid}/inspirations`;
const briefPath = (pid: string) => `/projects/${pid}/inspirations/designer-brief`;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

function assertImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error("Dozwolone formaty: JPEG, PNG, WebP.");
  if (file.size > MAX_SIZE) throw new Error("Plik może mieć maksymalnie 10 MB.");
}

export async function upsertInspiration(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const file = formData.get("file") as File | null;
  let storagePath: string | null = null;
  let source = getString(formData, "source", "URL");

  if (file && file.size > 0) {
    assertImageFile(file);
    source = "UPLOAD";
    const ext = file.name.split(".").pop() ?? "jpg";
    storagePath = `users/${user.id}/projects/${projectId}/inspirations/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("inspirations")
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);
  }

  const { error } = await supabase.from("inspirations").insert({
    project_id: projectId,
    room_id: getString(formData, "room_id") || null,
    source,
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    category: getString(formData, "category"),
    external_url: getString(formData, "external_url"),
    storage_bucket: storagePath ? "inspirations" : null,
    storage_path: storagePath,
    designer_note: getString(formData, "designer_note"),
    selected_for_designer: getBool(formData, "selected_for_designer"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(basePath(projectId));
  revalidatePath(briefPath(projectId));
}

export async function deleteInspiration(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { data } = await supabase
    .from("inspirations")
    .select("storage_bucket,storage_path")
    .eq("id", id)
    .eq("project_id", projectId)
    .single();
  if (data?.storage_bucket && data.storage_path) {
    await supabase.storage.from(data.storage_bucket).remove([data.storage_path]);
  }
  const { error } = await supabase.from("inspirations").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(basePath(projectId));
  revalidatePath(briefPath(projectId));
}

export async function toggleSelectedForDesigner(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const selected = getBool(formData, "selected");
  const { error } = await supabase
    .from("inspirations")
    .update({ selected_for_designer: selected })
    .eq("id", id)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(basePath(projectId));
  revalidatePath(briefPath(projectId));
}

export async function updateDesignerNote(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const roomId = getString(formData, "room_id");
  const { error } = await supabase
    .from("designer_brief_room_notes")
    .upsert(
      { project_id: projectId, room_id: roomId, note: getString(formData, "note") },
      { onConflict: "project_id,room_id" }
    );
  if (error) throw new Error(error.message);
  revalidatePath(briefPath(projectId));
}
