"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getString } from "@/lib/data";

export async function uploadDocument(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { user } = await requireUser();

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
    const ext = file.name.split(".").pop() ?? "bin";
    const uuid = crypto.randomUUID();
    storagePath = `users/${user.id}/projects/${projectId}/documents/${uuid}-${file.name}`;
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

  const { error } = await supabase.from("documents").insert({
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
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/documents`);
}

export async function deleteDocument(projectId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser();

  const id = getString(formData, "id");
  if (!id) throw new Error("ID jest wymagane");

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_bucket,storage_path")
    .eq("id", id)
    .single();

  if (doc?.storage_bucket && doc?.storage_path) {
    await supabase.storage.from(doc.storage_bucket).remove([doc.storage_path]);
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/documents`);
}
