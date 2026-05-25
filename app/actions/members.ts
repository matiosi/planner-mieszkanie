"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString } from "@/lib/data";

const memberPath = (projectId: string) => `/projects/${projectId}/members`;

export async function inviteMember(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const email = getString(formData, "email")?.trim().toLowerCase();
  const role = getString(formData, "role", "EDITOR") as string;

  if (!email) throw new Error("Email jest wymagany.");

  // Sprawdź czy user już istnieje
  const { data: existingUserId } = await supabase.rpc("get_user_id_by_email", { p_email: email });

  if (existingUserId) {
    // Użytkownik istnieje — dodaj go od razu
    const { error } = await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: existingUserId,
      role,
      invited_by: user.id,
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  } else {
    // Użytkownik nie istnieje — zapisz zaproszenie
    const { error } = await supabase.from("pending_invitations").insert({
      project_id: projectId,
      email,
      role,
      created_by: user.id,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath(memberPath(projectId));
}

export async function removeMember(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const memberId = formData.get("id") as string;
  const { error } = await supabase.from("project_members").delete().eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath(memberPath(projectId));
}

export async function updateMemberRole(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const memberId = formData.get("id") as string;
  const role = getString(formData, "role", "VIEWER");
  const { error } = await supabase.from("project_members").update({ role }).eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath(memberPath(projectId));
}

export async function revokeInvitation(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const invitationId = formData.get("id") as string;
  const { error } = await supabase.from("pending_invitations").delete().eq("id", invitationId);
  if (error) throw new Error(error.message);
  revalidatePath(memberPath(projectId));
}
