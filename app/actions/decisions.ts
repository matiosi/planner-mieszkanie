"use server";

import { revalidatePath } from "next/cache";
import { requireProject, requireProjectRole, getString, getBool } from "@/lib/data";

const path = (pid: string) => `/projects/${pid}/decisions`;

export async function upsertDecision(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
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
}

export async function deleteDecision(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase.from("decisions").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}

export async function updateDecisionApproval(projectId: string, formData: FormData) {
  const { supabase } = await requireProjectRole(projectId, ["OWNER", "EDITOR", "DESIGNER"]);
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
}
