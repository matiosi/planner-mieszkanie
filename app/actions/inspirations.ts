"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString, getBool } from "@/lib/data";
import { IMAGE_UPLOAD_POLICY, assertUpload, extensionForMime, safeFetchExternalResource, safeStoragePath } from "@/lib/security";

// ─── Import z URL (Pinterest, Houzz, inne) ────────────────────────────────────

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"'<>]+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"'<>]+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"'<>]+)["']`, "i"),
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m?.[1]) return m[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  }
  return null;
}

export async function importInspirationFromUrl(
  projectId: string,
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { supabase, user } = await requireProject(projectId);
    const url = getString(formData, "url")?.trim() ?? "";
    const roomId = getString(formData, "room_id") || null;
    const userNote = getString(formData, "description")?.trim() || null;

    if (!url) return { error: "Podaj URL." };

    // Czy to bezpośredni link do obrazka?
    const isDirectImage = /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(url);
    let imageUrl: string;

    if (isDirectImage) {
      imageUrl = url;
    } else {
      // Pobierz stronę i wyciągnij og:image
      const page = await safeFetchExternalResource(url, {
        accept: ["text/html", "application/xhtml+xml"],
        maxBytes: 2 * 1024 * 1024,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PlannerMieszkanie/1.0)",
          "Accept": "text/html,application/xhtml+xml",
        },
      });
      const html = new TextDecoder().decode(page.buffer);

      const ogImage = extractMeta(html, "og:image");
      if (!ogImage) return { error: "Nie znaleziono obrazka na tej stronie. Spróbuj wkleić bezpośredni link do zdjęcia." };

      imageUrl = ogImage;
    }

    // Pobierz obrazek
    const image = await safeFetchExternalResource(imageUrl, {
      accept: IMAGE_UPLOAD_POLICY.allowedTypes,
      maxBytes: IMAGE_UPLOAD_POLICY.maxBytes,
      headers: { "Referer": url, "User-Agent": "Mozilla/5.0" },
      timeoutMs: 15000,
    });
    const storagePath = `users/${user.id}/projects/${projectId}/inspirations/${crypto.randomUUID()}.${extensionForMime(image.contentType)}`;

    const { error: uploadError } = await supabase.storage
      .from("inspirations")
      .upload(storagePath, image.buffer, { contentType: image.contentType, upsert: false });

    if (uploadError) return { error: `Błąd uploadu: ${uploadError.message}` };

    const { error: dbError } = await supabase.from("inspirations").insert({
      project_id: projectId,
      room_id: roomId,
      source: "UPLOAD",
      title: "Inspiracja",
      description: userNote,
      external_url: url,
      storage_bucket: "inspirations",
      storage_path: storagePath,
      selected_for_designer: false,
    });

    if (dbError) return { error: `Błąd bazy: ${dbError.message}` };

    revalidatePath(basePath(projectId));
    revalidatePath(briefPath(projectId));
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Nieznany błąd.";
    // Timeout
    if (msg.includes("signal") || msg.includes("abort") || msg.includes("timeout")) {
      return { error: "Przekroczono czas oczekiwania. Sprawdź URL i spróbuj ponownie." };
    }
    return { error: msg };
  }
}

const basePath = (pid: string) => `/projects/${pid}/inspirations`;
const briefPath = (pid: string) => `/projects/${pid}/inspirations/designer-brief`;

function assertImageFile(file: File) {
  assertUpload(file, IMAGE_UPLOAD_POLICY);
}

export async function upsertInspiration(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const file = formData.get("file") as File | null;
  let storagePath: string | null = null;
  let source = getString(formData, "source", "URL");

  if (file && file.size > 0) {
    assertImageFile(file);
    source = "UPLOAD";
    storagePath = safeStoragePath(user.id, projectId, "inspirations", file.type);
    const { error: uploadError } = await supabase.storage
      .from("inspirations")
      .upload(storagePath, file, { contentType: file.type, upsert: false });
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
    selected_for_designer: getBool(formData, "selected_for_designer"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(basePath(projectId));
  revalidatePath(briefPath(projectId));
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
  revalidatePath(basePath(projectId));
  revalidatePath(briefPath(projectId));
}

export async function toggleSelectedForDesigner(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const id = getString(formData, "id");
  const selected = getBool(formData, "selected");
  const { error } = await supabase
    .from("inspirations")
    .update({ selected_for_designer: selected })
    .eq("id", id)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(basePath(projectId));
  revalidatePath(briefPath(projectId));
}

export async function updateDesignerNote(projectId: string, formData: FormData) {
  const { supabase } = await requireProject(projectId);
  const roomId = getString(formData, "room_id");
  const { error } = await supabase
    .from("designer_brief_room_notes")
    .upsert(
      { project_id: projectId, room_id: roomId, note: getString(formData, "note") },
      { onConflict: "project_id,room_id" }
    );
  if (error) throw new Error(error.message);
  revalidatePath(briefPath(projectId));
}
