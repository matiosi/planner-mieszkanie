"use server";

import { revalidatePath } from "next/cache";
import { requireProjectWrite, getBool, getString } from "@/lib/data";

export async function upsertVendorScopeItem(projectId: string, formData: FormData) {
  const { supabase } = await requireProjectWrite(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    vendor_id: getString(formData, "vendor_id"),
    room_id: getString(formData, "room_id") || null,
    title: getString(formData, "title"),
    description: getString(formData, "description") || null,
    included: getBool(formData, "included"),
    price_included: getBool(formData, "price_included"),
    price_note: getString(formData, "price_note") || null,
    notes: getString(formData, "notes") || null,
  };
  const { error } = id
    ? await supabase.from("vendor_scope_items").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("vendor_scope_items").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/vendors`);
}

export async function deleteVendorScopeItem(projectId: string, formData: FormData) {
  const { supabase } = await requireProjectWrite(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase.from("vendor_scope_items").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/vendors`);
}
