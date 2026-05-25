"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString, getNumber } from "@/lib/data";

const path = (pid: string) => `/projects/${pid}/products`;

export async function upsertProduct(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    room_id: getString(formData, "room_id") || null,
    budget_item_id: getString(formData, "budget_item_id") || null,
    name: getString(formData, "name"),
    category: getString(formData, "category"),
    price: getNumber(formData, "price"),
    url: getString(formData, "url"),
    image_url: getString(formData, "image_url"),
    store: getString(formData, "store"),
    status: getString(formData, "status", "FOUND"),
    delivery_status: getString(formData, "delivery_status", "NOT_ORDERED"),
    order_number: getString(formData, "order_number"),
    ordered_at: getString(formData, "ordered_at") || null,
    expected_delivery_date: getString(formData, "expected_delivery_date") || null,
    delivered_at: getString(formData, "delivered_at") || null,
    tracking_url: getString(formData, "tracking_url"),
    required_by: getString(formData, "required_by") || null,
    purchase_priority: getString(formData, "purchase_priority", "MEDIUM"),
    notes: getString(formData, "notes"),
  };
  const { error } = id
    ? await supabase.from("products").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("products").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}

export async function deleteProduct(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase.from("products").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}
