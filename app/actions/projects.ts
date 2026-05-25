"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, requireProject, getString, getNumber } from "@/lib/data";

const projectPath = (id: string, suffix = "") => `/projects/${id}${suffix}`;

async function removeStoragePrefix(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  bucket: string,
  prefix: string
) {
  const { data } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  const paths = data?.filter((f) => f.name).map((f) => `${prefix}/${f.name}`) ?? [];
  if (paths.length) await supabase.storage.from(bucket).remove(paths);
}

export async function createProject(_prevState: { error?: string } | null, formData: FormData) {
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
      description: getString(formData, "description"),
      contingency_percent: getNumber(formData, "contingency_percent") ?? 10,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Błąd podczas tworzenia projektu." };
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
      description: getString(formData, "description"),
      contingency_percent: getNumber(formData, "contingency_percent") ?? 10,
    })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(projectPath(projectId));
}

export async function deleteProject(projectId: string, _formData?: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const uid = user.id;
  const pid = projectId;
  await Promise.all([
    removeStoragePrefix(supabase, "inspirations", `users/${uid}/projects/${pid}/inspirations`),
    removeStoragePrefix(supabase, "plans", `users/${uid}/projects/${pid}/plans`),
    removeStoragePrefix(supabase, "documents", `users/${uid}/projects/${pid}/documents`),
    removeStoragePrefix(supabase, "progress-photos", `users/${uid}/projects/${pid}/progress`),
    removeStoragePrefix(supabase, "punch-list", `users/${uid}/projects/${pid}/punch-list`),
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
      description: "Przykładowy projekt do sprawdzenia przepływu pracy.",
      contingency_percent: 10,
    })
    .select("id")
    .single();
  if (error || !project) throw new Error(error?.message ?? "Błąd.");

  const pid = project.id;
  const roomNames = ["Salon", "Kuchnia", "Łazienka", "Sypialnia", "Gabinet", "Przedpokój", "Balkon"];
  const { data: rooms } = await supabase
    .from("rooms")
    .insert(roomNames.map((name, i) => ({ project_id: pid, name, status: "NOT_STARTED", sort_order: i })))
    .select("id,name");

  const roomId = (name: string) => rooms?.find((r) => r.name === name)?.id ?? null;

  await Promise.all([
    supabase.from("decisions").insert([
      "Wybór płytek do łazienki",
      "Układ kuchni",
      "Kolor ścian w salonie",
      "Rodzaj podłogi",
      "Drzwi wewnętrzne",
      "Oświetlenie",
    ].map((title, i) => ({
      project_id: pid,
      title,
      status: "NOT_STARTED",
      room_id: i === 0 ? roomId("Łazienka") : i === 1 ? roomId("Kuchnia") : null,
    }))),
    supabase.from("tasks").insert([
      { title: "Wybrać płytki do łazienki", room_id: roomId("Łazienka") },
      { title: "Potwierdzić układ kuchni", room_id: roomId("Kuchnia") },
      { title: "Zebrać wyceny od wykonawców", room_id: null },
      { title: "Ustalić punkty elektryczne", room_id: null },
      { title: "Wybrać drzwi wewnętrzne", room_id: null },
    ].map((t) => ({ ...t, project_id: pid, status: "TODO", priority: "MEDIUM" }))),
    supabase.from("budget_items").insert([
      { name: "Kuchnia na wymiar", category: "KITCHEN", planned_cost: 35000, room_id: roomId("Kuchnia") },
      { name: "Łazienka", category: "BATHROOM", planned_cost: 28000, room_id: roomId("Łazienka") },
      { name: "Podłoga", category: "FLOORING", planned_cost: 18000, room_id: null },
      { name: "Drzwi wewnętrzne", category: "DOORS", planned_cost: 12000, room_id: null },
      { name: "Oświetlenie", category: "LIGHTING", planned_cost: 8000, room_id: null },
      { name: "Meble ruchome", category: "FURNITURE", planned_cost: 30000, room_id: null },
      { name: "AGD", category: "APPLIANCES", planned_cost: 18000, room_id: roomId("Kuchnia") },
      { name: "Rezerwa", category: "RESERVE", planned_cost: 20000, room_id: null },
    ].map((b) => ({ ...b, project_id: pid, status: "PLANNED" }))),
  ]);

  redirect(`/projects/${pid}`);
}
