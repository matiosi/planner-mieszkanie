import type { SupabaseClient } from "@supabase/supabase-js";

export type EmbeddedPdfImage = {
  data: Buffer;
  format: "jpg" | "png";
};

/**
 * React-PDF accepts raw JPEG/PNG buffers. This avoids a second remote fetch
 * during rendering, which is unreliable for private Supabase Storage URLs.
 */
export async function storagePdfImage(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<EmbeddedPdfImage | null> {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error || !data) return null;

    if (data.type === "image/webp") {
      console.error("WEBP nie jest obsługiwany przez renderer PDF.", { bucket, path });
      return null;
    }
    return {
      data: Buffer.from(await data.arrayBuffer()),
      format: data.type === "image/png" ? "png" : "jpg",
    };
  } catch (error) {
    console.error("Nie udało się osadzić obrazu w PDF.", {
      bucket,
      path,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
