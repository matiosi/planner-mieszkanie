"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString } from "@/lib/data";
import { DOCUMENT_UPLOAD_POLICY, assertUpload, safeStoragePath } from "@/lib/security";
import { logActivity } from "@/lib/activity";

const path = (projectId: string) => `/projects/${projectId}/documents`;

export async function uploadDocument(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);

  const title = getString(formData, "title");
  const type = getString(formData, "type", "OTHER");
  const notes = getString(formData, "notes", "");
  const vendorId = getString(formData, "vendor_id", "");
  const roomId = getString(formData, "room_id", "");
  const purchaseDate = getString(formData, "purchase_date", "");
  const warrantyUntil = getString(formData, "warranty_until", "");
  const amount = formData.get("amount") ? Number(formData.get("amount")) : null;
  const invoiceNumber = getString(formData, "invoice_number", "");

  if (!title) throw new Error("Tytuł jest wymagany");

  const file = formData.get("file") as File | null;
  let storageBucket = "";
  let storagePath = "";
  let mimeType = "";
  let originalFileName = "";
  let fileSize: number | null = null;

  if (file && file.size > 0) {
    assertUpload(file, DOCUMENT_UPLOAD_POLICY);
    storagePath = safeStoragePath(user.id, projectId, "documents", file.type);
    storageBucket = "documents";

    const bytes = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(storagePath, bytes, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    mimeType = file.type;
    originalFileName = file.name;
    fileSize = file.size;
  } else {
    throw new Error("Plik jest wymagany");
  }

  const { data, error } = await supabase.from("documents").insert({
    project_id: projectId,
    title,
    type,
    notes: notes || null,
    vendor_id: vendorId || null,
    room_id: roomId || null,
    purchase_date: purchaseDate || null,
    warranty_until: warrantyUntil || null,
    amount,
    invoice_number: invoiceNumber || null,
    storage_bucket: storageBucket,
    storage_path: storagePath,
    mime_type: mimeType,
    original_file_name: originalFileName,
    file_size: fileSize,
  }).select("id").single();

  if (error) throw new Error(error.message);
  await logActivity(supabase, {
    projectId,
    userId: user.id,
    entityType: "document",
    entityId: data.id,
    action: "created",
    description: `Dodano dokument: "${title}"`,
  });
  revalidatePath(path(projectId));
  revalidatePath(`/projects/${projectId}/activity`);
}

export async function deleteDocument(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);

  const id = getString(formData, "id");
  if (!id) throw new Error("ID jest wymagane");

  const { data: doc } = await supabase
    .from("documents")
    .select("title,storage_bucket,storage_path")
    .eq("id", id)
    .eq("project_id", projectId)
    .single();

  if (doc?.storage_bucket && doc?.storage_path) {
    await supabase.storage.from(doc.storage_bucket).remove([doc.storage_path]);
  }

  const { error } = await supabase.from("documents").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  await logActivity(supabase, {
    projectId,
    userId: user.id,
    entityType: "document",
    entityId: id,
    action: "deleted",
    description: `Usunięto dokument: "${doc?.title ?? id}"`,
  });
  revalidatePath(path(projectId));
  revalidatePath(`/projects/${projectId}/activity`);
}
