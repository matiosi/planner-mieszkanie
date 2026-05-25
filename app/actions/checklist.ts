"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString } from "@/lib/data";

const path = (projectId: string) => `/projects/${projectId}/checklist`;

export async function createChecklist(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const name = getString(formData, "name") ?? "Nowa checklista";
  const room_id = getString(formData, "room_id") || null;
  const { error } = await supabase.from("checklists").insert({ project_id: projectId, name, room_id });
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}

export async function createFromTemplate(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const templateId = formData.get("template_id") as string;
  const room_id = getString(formData, "room_id") || null;

  const { data: template } = await supabase
    .from("checklist_templates")
    .select("name,items")
    .eq("id", templateId)
    .single();
  if (!template) throw new Error("Szablon nie istnieje.");

  const { data: checklist, error } = await supabase
    .from("checklists")
    .insert({ project_id: projectId, name: template.name, room_id })
    .select("id")
    .single();
  if (error || !checklist) throw new Error(error?.message ?? "Błąd.");

  const items = (template.items as string[]).map((title: string, i: number) => ({
    checklist_id: checklist.id,
    project_id: projectId,
    title,
    sort_order: i,
  }));
  if (items.length) await supabase.from("checklist_items").insert(items);

  revalidatePath(path(projectId));
}

export async function deleteChecklist(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = formData.get("id") as string;
  const { error } = await supabase.from("checklists").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}

export async function toggleChecklistItem(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = formData.get("id") as string;
  const done = formData.get("done") === "true";
  const { error } = await supabase.from("checklist_items").update({ done }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}

export async function addChecklistItem(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const checklist_id = formData.get("checklist_id") as string;
  const title = getString(formData, "title") ?? "";
  if (!title.trim()) return;
  const { error } = await supabase.from("checklist_items").insert({
    checklist_id,
    project_id: projectId,
    title,
    sort_order: 999,
  });
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}

export async function deleteChecklistItem(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = formData.get("id") as string;
  const { error } = await supabase.from("checklist_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}
