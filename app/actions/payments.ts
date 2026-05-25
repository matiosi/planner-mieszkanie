"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getString, getNumber } from "@/lib/data";

export async function upsertPayment(projectId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser();

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

  if (id) {
    const { error } = await supabase.from("payments").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("payments").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}/payments`);
}

export async function deletePayment(projectId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser();

  const id = getString(formData, "id");
  if (!id) throw new Error("ID jest wymagane");

  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}/payments`);
}
