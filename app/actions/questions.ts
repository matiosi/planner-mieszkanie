"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getString } from "@/lib/data";

export async function upsertQuestion(projectId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser();

  const id = getString(formData, "id", "");
  const question = getString(formData, "question");
  const answer = getString(formData, "answer", "");
  const status = getString(formData, "status", "OPEN");
  const assigneeType = getString(formData, "assignee_type", "");
  const assigneeName = getString(formData, "assignee_name", "");
  const roomId = getString(formData, "room_id", "");
  const vendorId = getString(formData, "vendor_id", "");
  const dueDate = getString(formData, "due_date", "");

  if (!question) throw new Error("Pytanie jest wymagane");

  const payload = {
    project_id: projectId,
    question,
    answer: answer || null,
    status,
    assignee_type: assigneeType || null,
    assignee_name: assigneeName || null,
    room_id: roomId || null,
    vendor_id: vendorId || null,
    due_date: dueDate || null,
  };

  if (id) {
    const { error } = await supabase.from("questions").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("questions").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}/questions`);
}

export async function deleteQuestion(projectId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser();

  const id = getString(formData, "id");
  if (!id) throw new Error("ID jest wymagane");

  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/questions`);
}
