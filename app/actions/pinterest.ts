"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/data";

export async function disconnectPinterest(_formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from("pinterest_connections").delete().eq("user_id", user.id);
  revalidatePath("/projects");
}
