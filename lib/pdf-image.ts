import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * React-PDF reliably renders embedded data URLs, unlike private signed Storage
 * URLs which may expire or fail while the document renderer fetches them.
 */
export async function storageImageDataUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error || !data) return null;

    const base64 = Buffer.from(await data.arrayBuffer()).toString("base64");
    return `data:${data.type || "image/jpeg"};base64,${base64}`;
  } catch (error) {
    console.error("Nie udało się osadzić obrazu w PDF.", {
      bucket,
      path,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
