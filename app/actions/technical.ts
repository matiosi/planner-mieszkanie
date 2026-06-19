"use server";

import { revalidatePath } from "next/cache";
import { requireProjectWrite, getString, getNumber } from "@/lib/data";

export async function upsertRoomTechnicalDetails(projectId: string, roomId: string, formData: FormData) {
  const { supabase } = await requireProjectWrite(projectId);
  const payload = {
    project_id: projectId,
    room_id: roomId,
    ceiling_height: getNumber(formData, "ceiling_height"),
    flooring_area: getNumber(formData, "flooring_area"),
    wall_area: getNumber(formData, "wall_area"),
    skirting_length: getNumber(formData, "skirting_length"),
    number_of_light_points: getNumber(formData, "number_of_light_points"),
    number_of_sockets: getNumber(formData, "number_of_sockets"),
    window_dimensions: getString(formData, "window_dimensions") || null,
    door_dimensions: getString(formData, "door_dimensions") || null,
    notes: getString(formData, "notes") || null,
  };
  const { error } = await supabase
    .from("room_technical_details")
    .upsert(payload, { onConflict: "room_id" });
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/rooms/${roomId}`);
  revalidatePath(`/projects/${projectId}/rooms/${roomId}/technical`);
}
