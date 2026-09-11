"use server";

import { revalidatePath } from "next/cache";
import { requireProject, requireProjectRole, getString, getBool } from "@/lib/data";
import { logActivity } from "@/lib/activity";

const path = (pid: string) => `/projects/${pid}/decisions`;

export async function upsertDecision(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    room_id: getString(formData, "room_id") || null,
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    status: getString(formData, "status", "NOT_STARTED"),
    selected_option: getString(formData, "selected_option"),
    notes: getString(formData, "notes"),
    requires_approval: getBool(formData, "requires_approval"),
  };
  const { data: previous } = id
    ? await supabase.from("decisions").select("status").eq("id", id).eq("project_id", projectId).maybeSingle()
    : { data: null };
  const { data, error } = id
    ? await supabase.from("decisions").update(payload).eq("id", id).eq("project_id", projectId).select("id").single()
    : await supabase.from("decisions").insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  if (payload.requires_approval && data?.id) {
    await supabase.from("decision_approvals").upsert(
      { project_id: projectId, decision_id: data.id, status: "PENDING" },
      { onConflict: "decision_id" }
    );
  }
  revalidatePath(path(projectId));
  await logActivity(supabase, {
    projectId,
    userId: user.id,
    entityType: "decision",
    entityId: data?.id ?? id,
    action: id && previous?.status !== payload.status ? "status_changed" : id ? "updated" : "created",
    description: id && previous?.status !== payload.status
      ? `Zmieniono status decyzji: "${payload.title}"`
      : id ? `Edytowano decyzję: "${payload.title}"` : `Dodano decyzję: "${payload.title}"`,
  });
  revalidatePath(`/projects/${projectId}/activity`);
}

export async function deleteDecision(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { data: decision } = await supabase.from("decisions").select("title").eq("id", id).eq("project_id", projectId).single();
  const { error } = await supabase.from("decisions").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
  await logActivity(supabase, {
    projectId,
    userId: user.id,
    entityType: "decision",
    entityId: id,
    action: "deleted",
    description: `Usunięto decyzję: "${decision?.title ?? id}"`,
  });
  revalidatePath(`/projects/${projectId}/activity`);
}

export async function updateDecisionApproval(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProjectRole(projectId, ["OWNER", "EDITOR", "DESIGNER"]);
  const decisionId = getString(formData, "decision_id");
  const status = getString(formData, "status", "APPROVED");
  if (!["APPROVED", "REJECTED"].includes(status)) throw new Error("Nieprawidłowy status akceptacji.");

  const { error } = await supabase
    .from("decision_approvals")
    .upsert(
      {
        project_id: projectId,
        decision_id: decisionId,
        status,
        notes: getString(formData, "notes") || null,
      },
      { onConflict: "decision_id" }
    );
  if (error) throw new Error(error.message);

  if (status === "APPROVED") {
    await supabase.from("decisions").update({ status: "DECIDED" }).eq("id", decisionId).eq("project_id", projectId);
  }
  revalidatePath(path(projectId));
  const { data: decision } = await supabase.from("decisions").select("title").eq("id", decisionId).eq("project_id", projectId).single();
  await logActivity(supabase, {
    projectId,
    userId: user.id,
    entityType: "decision",
    entityId: decisionId,
    action: "status_changed",
    description: `${status === "APPROVED" ? "Zatwierdzono" : "Odrzucono"} decyzję: "${decision?.title ?? decisionId}"`,
  });
  revalidatePath(`/projects/${projectId}/activity`);
}
