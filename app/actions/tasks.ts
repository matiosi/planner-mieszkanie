"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString, getNumber } from "@/lib/data";

const path = (pid: string) => `/projects/${pid}/tasks`;

export async function upsertTask(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    room_id: getString(formData, "room_id") || null,
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    status: getString(formData, "status", "TODO"),
    priority: getString(formData, "priority", "MEDIUM"),
    due_date: getString(formData, "due_date") || null,
  };
  const { error } = id
    ? await supabase.from("tasks").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("tasks").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}

export async function deleteTask(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}

export async function addTaskDependency(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const taskId = getString(formData, "task_id");
  const blockedByTaskId = getString(formData, "blocked_by_task_id");
  if (taskId === blockedByTaskId) throw new Error("Zadanie nie może blokować samego siebie.");
  const { error } = await supabase.from("task_dependencies").insert({
    project_id: projectId,
    task_id: taskId,
    blocked_by_task_id: blockedByTaskId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}

export async function removeTaskDependency(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase.from("task_dependencies").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}
