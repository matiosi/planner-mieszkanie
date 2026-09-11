"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString } from "@/lib/data";
import { logActivity } from "@/lib/activity";

const path = (projectId: string) => `/projects/${projectId}/questions`;

export async function upsertQuestion(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);

  const id = getString(formData, "id", "");
  const question = getString(formData, "question");
  const answer = getString(formData, "answer", "");
  const status = id ? getString(formData, "status", "OPEN") : "OPEN";
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
    const { error } = await supabase.from("questions").update(payload).eq("id", id).eq("project_id", projectId);
    if (error) throw new Error(error.message);
    await logActivity(supabase, {
      projectId,
      userId: user.id,
      entityType: "question",
      entityId: id,
      action: "updated",
      description: `Edytowano pytanie: "${question}"`,
    });
  } else {
    const { data, error } = await supabase.from("questions").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    await logActivity(supabase, {
      projectId,
      userId: user.id,
      entityType: "question",
      entityId: data.id,
      action: "created",
      description: `Dodano pytanie: "${question}"`,
    });
  }

  revalidatePath(path(projectId));
  revalidatePath(`/projects/${projectId}/activity`);
}

export async function deleteQuestion(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);

  const id = getString(formData, "id");
  if (!id) throw new Error("ID jest wymagane");

  const { data: question } = await supabase
    .from("questions")
    .select("question")
    .eq("id", id)
    .eq("project_id", projectId)
    .single();
  const { error } = await supabase.from("questions").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  await logActivity(supabase, {
    projectId,
    userId: user.id,
    entityType: "question",
    entityId: id,
    action: "deleted",
    description: `Usunięto pytanie: "${question?.question ?? id}"`,
  });
  revalidatePath(path(projectId));
  revalidatePath(`/projects/${projectId}/activity`);
}

export async function answerQuestion(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const id = getString(formData, "id");
  const answer = getString(formData, "answer");
  if (!id) throw new Error("ID pytania jest wymagane.");
  if (!answer) throw new Error("Odpowiedź jest wymagana.");

  const { data: question } = await supabase
    .from("questions")
    .select("question")
    .eq("id", id)
    .eq("project_id", projectId)
    .single();
  const { error } = await supabase
    .from("questions")
    .update({ answer, status: "ANSWERED" })
    .eq("id", id)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    projectId,
    userId: user.id,
    entityType: "question",
    entityId: id,
    action: "status_changed",
    description: `Odpowiedziano na pytanie: "${question?.question ?? id}"`,
  });
  revalidatePath(path(projectId));
  revalidatePath(`/projects/${projectId}/activity`);
}

const QUESTION_STATUS_ACTIONS = {
  CLOSED: "Zamknięto",
  NEEDS_FOLLOW_UP: "Oznaczono do doprecyzowania",
  OPEN: "Otwarto ponownie",
} as const;

export async function setQuestionStatus(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const id = getString(formData, "id");
  const status = getString(formData, "status") as keyof typeof QUESTION_STATUS_ACTIONS;
  if (!id) throw new Error("ID pytania jest wymagane.");
  if (!(status in QUESTION_STATUS_ACTIONS)) throw new Error("Nieprawidłowy status pytania.");

  const { data: question } = await supabase
    .from("questions")
    .select("question")
    .eq("id", id)
    .eq("project_id", projectId)
    .single();
  const { error } = await supabase
    .from("questions")
    .update({ status })
    .eq("id", id)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    projectId,
    userId: user.id,
    entityType: "question",
    entityId: id,
    action: "status_changed",
    description: `${QUESTION_STATUS_ACTIONS[status]} pytanie: "${question?.question ?? id}"`,
  });
  revalidatePath(path(projectId));
  revalidatePath(`/projects/${projectId}/activity`);
}
