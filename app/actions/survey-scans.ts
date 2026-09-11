"use server";

import { revalidatePath } from "next/cache";
import { getString, requireProject } from "@/lib/data";

const briefPath = (projectId: string) => `/projects/${projectId}/inspirations/designer-brief`;

export async function deleteSurveyScan(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { data } = await supabase
    .from("survey_scans")
    .select("storage_bucket,storage_path")
    .eq("id", id)
    .eq("project_id", projectId)
    .single();

  if (data?.storage_bucket && data.storage_path) {
    await supabase.storage.from(data.storage_bucket).remove([data.storage_path]);
  }

  const { error } = await supabase
    .from("survey_scans")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);

  revalidatePath(briefPath(projectId));
}
