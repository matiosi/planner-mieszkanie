"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString } from "@/lib/data";

const plansPath = (pid: string) => `/projects/${pid}/plans`;
const comparePath = (pid: string) => `/projects/${pid}/plans/compare`;

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 20 * 1024 * 1024;

export async function uploadPlan(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Wybierz plik planu.");
  if (!ALLOWED.includes(file.type)) throw new Error("Dozwolone formaty: JPEG, PNG, WebP.");
  if (file.size > MAX_SIZE) throw new Error("Plik może mieć maksymalnie 20 MB.");

  const planType = getString(formData, "plan_type", "ORIGINAL");
  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `users/${user.id}/projects/${projectId}/plans/${planType.toLowerCase()}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("plans").upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase.from("project_plans").insert({
    project_id: projectId,
    plan_type: planType,
    title: getString(formData, "title") || (planType === "ORIGINAL" ? "Plan pierwotny" : "Plan projektanta"),
    storage_bucket: "plans",
    storage_path: storagePath,
    mime_type: file.type,
    original_file_name: file.name,
    version_label: getString(formData, "version_label"),
    is_current: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath(plansPath(projectId));
}

export async function deletePlan(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { data } = await supabase
    .from("project_plans")
    .select("storage_bucket,storage_path")
    .eq("id", id)
    .eq("project_id", projectId)
    .single();
  if (data?.storage_bucket && data.storage_path) {
    await supabase.storage.from(data.storage_bucket).remove([data.storage_path]);
  }
  const { error } = await supabase.from("project_plans").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(plansPath(projectId));
}

export async function upsertPlanDifference(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    room_id: getString(formData, "room_id") || null,
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    status: getString(formData, "status", "NEEDS_DISCUSSION"),
    priority: getString(formData, "priority", "MEDIUM"),
  };
  const { error } = id
    ? await supabase.from("plan_differences").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("plan_differences").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(comparePath(projectId));
}

export async function deletePlanDifference(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase.from("plan_differences").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(comparePath(projectId));
}
