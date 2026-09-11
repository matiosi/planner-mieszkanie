"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString, getNumber } from "@/lib/data";
import { logActivity } from "@/lib/activity";

const path = (projectId: string) => `/projects/${projectId}/payments`;

export async function upsertPayment(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);

  const id = getString(formData, "id", "");
  const title = getString(formData, "title");
  const amount = getNumber(formData, "amount");
  const status = getString(formData, "status", "PLANNED");
  const plannedDate = getString(formData, "planned_date", "");
  const paidDate = getString(formData, "paid_date", "");
  const vendorId = getString(formData, "vendor_id", "");
  const paymentMethod = getString(formData, "payment_method", "");
  const notes = getString(formData, "notes", "");

  if (!title) throw new Error("Tytuł jest wymagany");
  if (amount === null || isNaN(amount)) throw new Error("Kwota jest wymagana");

  const payload = {
    project_id: projectId,
    title,
    amount,
    status,
    planned_date: plannedDate || null,
    paid_date: paidDate || null,
    vendor_id: vendorId || null,
    payment_method: paymentMethod || null,
    notes: notes || null,
  };

  const { data, error } = id
    ? await supabase.from("payments").update(payload).eq("id", id).eq("project_id", projectId).select("id").single()
    : await supabase.from("payments").insert(payload).select("id").single();
  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    projectId,
    userId: user.id,
    entityType: "payment",
    entityId: (data?.id ?? id) || null,
    action: id ? "updated" : "created",
    description: id ? `Edytowano płatność: "${title}"` : `Dodano płatność: "${title}"`,
  });
  revalidatePath(path(projectId));
  revalidatePath(`/projects/${projectId}/activity`);
}

export async function deletePayment(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);

  const id = getString(formData, "id");
  if (!id) throw new Error("ID jest wymagane");

  const { data: payment } = await supabase.from("payments").select("title").eq("id", id).eq("project_id", projectId).single();
  const { error } = await supabase.from("payments").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  await logActivity(supabase, {
    projectId,
    userId: user.id,
    entityType: "payment",
    entityId: id,
    action: "deleted",
    description: `Usunięto płatność: "${payment?.title ?? id}"`,
  });
  revalidatePath(path(projectId));
  revalidatePath(`/projects/${projectId}/activity`);
}
