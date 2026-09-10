"use server";

import { revalidatePath } from "next/cache";
import { requireProjectAccess, getString } from "@/lib/data";

export async function markNotificationRead(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProjectAccess(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("project_id", projectId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/notifications`);
}

export async function markAllNotificationsRead(projectId: string) {
  const { supabase, user } = await requireProjectAccess(projectId);
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .is("ignored_at", null)
    .eq("read", false);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/notifications`);
}

export async function ignoreNotification(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProjectAccess(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase
    .from("notifications")
    .update({ ignored_at: new Date().toISOString(), read: true })
    .eq("id", id)
    .eq("project_id", projectId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/notifications`);
}

export async function restoreNotification(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProjectAccess(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase
    .from("notifications")
    .update({ ignored_at: null })
    .eq("id", id)
    .eq("project_id", projectId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/notifications`);
}
