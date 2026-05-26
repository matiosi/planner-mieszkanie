"use server";

import { revalidatePath } from "next/cache";
import { requireProject, getString, getBool } from "@/lib/data";

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
      const pageRes = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          "Accept": "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(12000),
      });

      if (!pageRes.ok) return { error: `Nie udało się pobrać strony (${pageRes.status}).` };
      const html = await pageRes.text();

      const ogImage = extractMeta(html, "og:image");
      if (!ogImage) return { error: "Nie znaleziono obrazka na tej stronie. Spróbuj wkleić bezpośredni link do zdjęcia." };

      imageUrl = ogImage;
    }

    // Pobierz obrazek
    const imgRes = await fetch(imageUrl, {
      headers: { "Referer": url, "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!imgRes.ok) return { error: "Nie udało się pobrać obrazka (może wymaga logowania?)." };

    const rawType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const contentType = rawType.split(";")[0].trim();
    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
      return { error: "Nieobsługiwany format obrazka (dozwolone: JPEG, PNG, WebP)." };
    }

    const buffer = await imgRes.arrayBuffer();
    if (buffer.byteLength > 10 * 1024 * 1024) return { error: "Obrazek jest za duży (maks. 10 MB)." };

    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const storagePath = `users/${user.id}/projects/${projectId}/inspirations/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("inspirations")
      .upload(storagePath, buffer, { contentType, upsert: false });

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

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

function assertImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error("Dozwolone formaty: JPEG, PNG, WebP.");
  if (file.size > MAX_SIZE) throw new Error("Plik może mieć maksymalnie 10 MB.");
}

export async function upsertInspiration(projectId: string, formData: FormData) {
  const { supabase, user } = await requireProject(projectId);
  const file = formData.get("file") as File | null;
  let storagePath: string | null = null;
  let source = getString(formData, "source", "URL");

  if (file && file.size > 0) {
    assertImageFile(file);
    source = "UPLOAD";
    const ext = file.name.split(".").pop() ?? "jpg";
    storagePath = `users/${user.id}/projects/${projectId}/inspirations/${crypto.randomUUID()}.${ext}`;
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
