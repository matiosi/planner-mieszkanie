"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getNumber, getString, requireProject, requireUser } from "@/lib/data";

const projectPath = (projectId: string, suffix = "") => `/projects/${projectId}${suffix}`;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 10 * 1024 * 1024;

function assertImageFile(file: File) {
  if (!allowedImageTypes.includes(file.type)) {
    throw new Error("Dozwolone są tylko pliki JPEG, PNG albo WebP.");
  }

  if (file.size > maxImageSize) {
    throw new Error("Plik może mieć maksymalnie 10 MB.");
  }
}

async function removeStoragePrefix(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  bucket: string,
  prefix: string
) {
  const { data } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  const paths = data?.filter((item) => item.name).map((item) => `${prefix}/${item.name}`) ?? [];
  if (paths.length) {
    await supabase.storage.from(bucket).remove(paths);
  }
}

export async function createProject(formData: FormData) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      name: getString(formData, "name"),
      area: getNumber(formData, "area"),
      target_budget: getNumber(formData, "target_budget"),
      style: getString(formData, "style"),
      stage: getString(formData, "stage", "PLANNING"),
      description: getString(formData, "description")
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/projects/${data.id}`);
}

export async function updateProject(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const { error } = await supabase
    .from("projects")
    .update({
      name: getString(formData, "name"),
      area: getNumber(formData, "area"),
      target_budget: getNumber(formData, "target_budget"),
      style: getString(formData, "style"),
      stage: getString(formData, "stage", "PLANNING"),
      description: getString(formData, "description")
    })
    .eq("id", projectId);

  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId));
}

export async function deleteProject(projectId: string) {
  const { supabase, user } = await requireProject(projectId);
  await Promise.all([
    removeStoragePrefix(supabase, "inspirations", `users/${user.id}/projects/${projectId}/inspirations`),
    removeStoragePrefix(supabase, "plans", `users/${user.id}/projects/${projectId}/plans`)
  ]);
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(error.message);
  redirect("/projects");
}

export async function createDemoProject() {
  const { supabase, user } = await requireUser();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      name: "Mieszkanie B2-C134",
      area: 81.52,
      target_budget: 180000,
      style: "Japandi, jasne kolory, nowoczesne wnętrze",
      stage: "PLANNING",
      description: "Przykładowy projekt do sprawdzenia przepływu pracy."
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const projectId = project.id;
  const rooms = ["Salon", "Kuchnia", "Łazienka", "Sypialnia", "Gabinet", "Przedpokój", "Balkon"].map((name) => ({
    project_id: projectId,
    name,
    status: "NOT_STARTED"
  }));
  const { data: insertedRooms } = await supabase.from("rooms").insert(rooms).select("id,name");
  const roomId = (name: string) => insertedRooms?.find((room) => room.name === name)?.id ?? null;

  await Promise.all([
    supabase.from("decisions").insert([
      "Wybór płytek do łazienki",
      "Układ kuchni",
      "Kolor ścian w salonie",
      "Rodzaj podłogi",
      "Drzwi wewnętrzne",
      "Oświetlenie"
    ].map((title) => ({ project_id: projectId, title, status: "NOT_STARTED" }))),
    supabase.from("tasks").insert([
      "Wybrać płytki do łazienki",
      "Potwierdzić układ kuchni",
      "Zebrać wyceny od wykonawców",
      "Ustalić punkty elektryczne",
      "Wybrać drzwi wewnętrzne"
    ].map((title) => ({ project_id: projectId, title, status: "TODO", priority: "MEDIUM" }))),
    supabase.from("budget_items").insert([
      ["Kuchnia na wymiar", "KITCHEN", 35000, "Kuchnia"],
      ["Łazienka", "BATHROOM", 28000, "Łazienka"],
      ["Podłoga", "FLOORING", 18000, null],
      ["Drzwi wewnętrzne", "DOORS", 12000, null],
      ["Oświetlenie", "LIGHTING", 8000, null],
      ["Meble ruchome", "FURNITURE", 30000, null],
      ["AGD", "APPLIANCES", 18000, "Kuchnia"],
      ["Rezerwa", "RESERVE", 20000, null]
    ].map(([name, category, planned_cost, room]) => ({
      project_id: projectId,
      name,
      category,
      planned_cost,
      status: "PLANNED",
      room_id: typeof room === "string" ? roomId(room) : null
    })))
  ]);

  redirect(`/projects/${projectId}`);
}

export async function upsertRoom(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    name: getString(formData, "name"),
    area: getNumber(formData, "area"),
    status: getString(formData, "status", "NOT_STARTED"),
    concept_description: getString(formData, "concept_description"),
    notes: getString(formData, "notes"),
    budget_planned: getNumber(formData, "budget_planned")
  };
  const { error } = id
    ? await supabase.from("rooms").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("rooms").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId, "/rooms"));
}

export async function deleteRow(projectId: string, table: string, path: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { error } = await supabase.from(table).delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId, path));
}

export async function deleteInspiration(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const { data } = await supabase
    .from("inspirations")
    .select("storage_bucket,storage_path")
    .eq("id", id)
    .eq("project_id", projectId)
    .single();

  if (data?.storage_bucket && data.storage_path) {
    await supabase.storage.from(data.storage_bucket).remove([data.storage_path]);
  }

  const { error } = await supabase.from("inspirations").delete().eq("id", id).eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId, "/inspirations"));
  revalidatePath(projectPath(projectId, "/inspirations/designer-brief"));
}

export async function upsertBudgetItem(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    room_id: getString(formData, "room_id") || null,
    name: getString(formData, "name"),
    category: getString(formData, "category", "OTHER"),
    planned_cost: getNumber(formData, "planned_cost"),
    actual_cost: getNumber(formData, "actual_cost"),
    status: getString(formData, "status", "PLANNED"),
    notes: getString(formData, "notes"),
    unexpected_cost: formData.get("unexpected_cost") === "on"
  };
  const { error } = id
    ? await supabase.from("budget_items").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("budget_items").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId, "/budget"));
}

export async function upsertTask(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    room_id: getString(formData, "room_id") || null,
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    status: getString(formData, "status", "TODO"),
    priority: getString(formData, "priority", "MEDIUM"),
    due_date: getString(formData, "due_date") || null,
    blocked_by: getString(formData, "blocked_by")
  };
  const { error } = id
    ? await supabase.from("tasks").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("tasks").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId, "/tasks"));
}

export async function upsertProduct(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    room_id: getString(formData, "room_id") || null,
    name: getString(formData, "name"),
    category: getString(formData, "category"),
    price: getNumber(formData, "price"),
    url: getString(formData, "url"),
    image_url: getString(formData, "image_url"),
    store: getString(formData, "store"),
    status: getString(formData, "status", "FOUND"),
    delivery_status: getString(formData, "delivery_status", "NOT_ORDERED"),
    expected_delivery_date: getString(formData, "expected_delivery_date") || null,
    notes: getString(formData, "notes")
  };
  const { error } = id
    ? await supabase.from("products").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("products").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId, "/products"));
}

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
    notes: getString(formData, "notes")
  };
  const { error } = id
    ? await supabase.from("decisions").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("decisions").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId, "/decisions"));
}

export async function upsertVendor(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    name: getString(formData, "name"),
    type: getString(formData, "type", "OTHER"),
    phone: getString(formData, "phone"),
    email: getString(formData, "email"),
    offer_amount: getNumber(formData, "offer_amount"),
    status: getString(formData, "status", "CONTACTED"),
    notes: getString(formData, "notes")
  };
  const { error } = id
    ? await supabase.from("vendors").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("vendors").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId, "/vendors"));
}

export async function upsertInspiration(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const file = formData.get("file") as File | null;
  let storagePath: string | null = null;
  let source = getString(formData, "source", "URL");

  if (file && file.size > 0) {
    assertImageFile(file);
    source = "UPLOAD";
    const ext = file.name.split(".").pop() || "jpg";
    storagePath = `users/${user.id}/projects/${projectId}/inspirations/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("inspirations").upload(storagePath, file, {
      contentType: file.type,
      upsert: false
    });
    if (uploadError) throw new Error(uploadError.message);
  }

  const { error } = await supabase.from("inspirations").insert({
    project_id: projectId,
    room_id: getString(formData, "room_id") || null,
    source,
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    category: getString(formData, "category"),
    external_url: getString(formData, "external_url"),
    storage_bucket: storagePath ? "inspirations" : null,
    storage_path: storagePath,
    designer_note: getString(formData, "designer_note"),
    selected_for_designer: formData.get("selected_for_designer") === "on"
  });
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId, "/inspirations"));
  revalidatePath(projectPath(projectId, "/inspirations/designer-brief"));
}

export async function updateDesignerNote(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const roomId = getString(formData, "room_id");
  const { error } = await supabase.from("designer_brief_room_notes").upsert({
    project_id: projectId,
    room_id: roomId,
    note: getString(formData, "note")
  }, { onConflict: "project_id,room_id" });
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId, "/inspirations/designer-brief"));
}

export async function uploadPlan(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Wybierz plik planu.");
  assertImageFile(file);

  const planType = getString(formData, "plan_type", "ORIGINAL");
  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = `users/${user.id}/projects/${projectId}/plans/${planType.toLowerCase()}-${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("plans").upload(storagePath, file, {
    contentType: file.type,
    upsert: false
  });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase.from("project_plans").insert({
    project_id: projectId,
    plan_type: planType,
    title: getString(formData, "title") || (planType === "ORIGINAL" ? "Plan pierwotny" : "Plan projektanta"),
    storage_bucket: "plans",
    storage_path: storagePath,
    mime_type: file.type,
    original_file_name: file.name,
    version_label: getString(formData, "version_label"),
    is_current: true
  });
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId, "/plans"));
}

export async function upsertPlanDifference(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const payload = {
    project_id: projectId,
    room_id: getString(formData, "room_id") || null,
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    status: getString(formData, "status", "NEEDS_DISCUSSION"),
    priority: getString(formData, "priority", "MEDIUM")
  };
  const { error } = id
    ? await supabase.from("plan_differences").update(payload).eq("id", id).eq("project_id", projectId)
    : await supabase.from("plan_differences").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId, "/plans/compare"));
}
