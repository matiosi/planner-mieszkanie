"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getString } from "@/lib/data";

export async function createShareLink(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { user } = await requireUser();

  const scope = getString(formData, "scope", "WHOLE_PROJECT");
  const expiresAt = getString(formData, "expires_at", "");

  const { error } = await supabase.from("share_links").insert({
    project_id: projectId,
    scope,
    expires_at: expiresAt || null,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/share`);
}

export async function revokeShareLink(projectId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser();

  const id = getString(formData, "id");
  if (!id) throw new Error("ID jest wymagane");

  const { error } = await supabase.from("share_links").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/share`);
}
