"use server";

import { revalidatePath } from "next/cache";
import { requireProjectOwner, getString } from "@/lib/data";

const path = (projectId: string) => `/projects/${projectId}/share`;

function parseRoomIds(formData: FormData) {
  return formData.getAll("room_ids").map(String).filter(Boolean);
}

export async function createShareLink(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProjectOwner(projectId);
  const expiresAt = getString(formData, "expires_at");
  const roomIds = parseRoomIds(formData);
  const { error } = await supabase.from("share_links").insert({
    project_id: projectId,
    scope: getString(formData, "scope", "WHOLE_PROJECT"),
    room_ids: roomIds.length ? roomIds : null,
    expires_at: expiresAt || null,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}

export async function deleteShareLink(projectId: string, formData: FormData) {
  const { supabase } = await requireProjectOwner(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase.from("share_links").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(path(projectId));
}
