"use server";

import { revalidatePath } from "next/cache";
import { requireUser, getString } from "@/lib/data";

// ─── Sklepy ───────────────────────────────────────────────────────────────────

export async function upsertStore(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = getString(formData, "id") || null;
  const rating = getString(formData, "rating");

  const payload = {
    user_id: user.id,
    name: getString(formData, "name") ?? "",
    url: getString(formData, "url") || null,
    category: getString(formData, "category") || null,
    notes: getString(formData, "notes") || null,
    rating: rating ? Number(rating) : null,
  };

  const { error } = id
    ? await supabase.from("stores").update(payload).eq("id", id).eq("user_id", user.id)
    : await supabase.from("stores").insert(payload);

  if (error) throw new Error(error.message);
  revalidatePath("/library/stores");
}

export async function deleteStore(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = getString(formData, "id");
  const { error } = await supabase.from("stores").delete().eq("id", id!).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/library/stores");
}

// ─── Biblioteka produktów ─────────────────────────────────────────────────────

export async function upsertLibraryProduct(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = getString(formData, "id") || null;
  const price = getString(formData, "price");

  const payload = {
    user_id: user.id,
    name: getString(formData, "name") ?? "",
    category: getString(formData, "category") || null,
    url: getString(formData, "url") || null,
    price: price ? Number(price) : null,
    store: getString(formData, "store") || null,
    notes: getString(formData, "notes") || null,
    image_url: getString(formData, "image_url") || null,
  };

  const { error } = id
    ? await supabase.from("user_product_library").update(payload).eq("id", id).eq("user_id", user.id)
    : await supabase.from("user_product_library").insert(payload);

  if (error) throw new Error(error.message);
  revalidatePath("/library/products");
}

export async function deleteLibraryProduct(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = getString(formData, "id");
  const { error } = await supabase
    .from("user_product_library")
    .delete()
    .eq("id", id!)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/library/products");
}

export async function addLibraryProductToProject(formData: FormData) {
  const { supabase, user } = await requireUser();
  const libraryId = getString(formData, "library_id");
  const projectId = getString(formData, "project_id");
  const roomId = getString(formData, "room_id") || null;

  if (!libraryId || !projectId) throw new Error("Brak wymaganych pól.");

  const { data: product } = await supabase
    .from("user_product_library")
    .select("name,category,url,price,store,notes,image_url")
    .eq("id", libraryId)
    .eq("user_id", user.id)
    .single();

  if (!product) throw new Error("Produkt nie istnieje.");

  const { error } = await supabase.from("products").insert({
    project_id: projectId,
    room_id: roomId,
    name: product.name,
    category: product.category,
    url: product.url,
    price: product.price,
    store: product.store,
    notes: product.notes,
    image_url: product.image_url,
    status: "FOUND",
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/products`);
}
