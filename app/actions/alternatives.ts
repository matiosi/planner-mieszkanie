"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString, getNumber } from "@/lib/data";

export async function upsertAlternative(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = formData.get("id") as string | null;

  const payload = {
    project_id: projectId,
    decision_id: getString(formData, "decision_id") || null,
    product_id: getString(formData, "product_id") || null,
    name: getString(formData, "name") ?? "",
    url: getString(formData, "url") || null,
    price: getNumber(formData, "price"),
    pros: getString(formData, "pros") || null,
    cons: getString(formData, "cons") || null,
  };

  if (id) {
    const { error } = await supabase.from("alternatives").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("alternatives").insert(payload);
    if (error) throw new Error(error.message);
  }
  revalidatePath(`/projects/${projectId}/decisions`);
}

export async function deleteAlternative(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = formData.get("id") as string;
  const { error } = await supabase.from("alternatives").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/decisions`);
}

export async function selectAlternative(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const alternativeId = formData.get("id") as string;
  const decisionId = formData.get("decision_id") as string;

  // Odznacz wszystkie inne
  await supabase.from("alternatives").update({ selected: false }).eq("decision_id", decisionId);
  // Zaznacz wybraną
  await supabase.from("alternatives").update({ selected: true }).eq("id", alternativeId);
  // Zaktualizuj status decyzji
  const { data: alt } = await supabase.from("alternatives").select("name").eq("id", alternativeId).single();
  if (alt) {
    await supabase.from("decisions").update({ status: "DECIDED", selected_option: alt.name }).eq("id", decisionId);
  }

  revalidatePath(`/projects/${projectId}/decisions`);
}
