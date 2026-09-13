import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";

export type EmbeddedPdfImage = {
  data: Buffer;
  format: "jpg";
};

/**
 * Image conversion can temporarily use significant memory. Keep the number
 * of concurrent conversions low when a user exports a batch of survey scans.
 */
export async function mapPdfImages<T, Result>(
  items: readonly T[],
  mapper: (item: T, index: number) => Promise<Result>,
  concurrency = 2
): Promise<Result[]> {
  const results = new Array<Result>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(Math.max(concurrency, 1), items.length) }, worker)
  );
  return results;
}

/**
 * Converts storage uploads to a compact, baseline JPEG that React-PDF can
 * decode reliably. This also corrects camera orientation and supports the
 * WEBP files accepted by the survey uploader.
 */
export async function storagePdfImage(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<EmbeddedPdfImage | null> {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error || !data) {
      console.error("Nie udało się pobrać obrazu do PDF.", {
        bucket,
        path,
        message: error?.message,
      });
      return null;
    }

    const source = Buffer.from(await data.arrayBuffer());
    const normalized = await sharp(source, {
      failOn: "none",
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize({
        width: 1600,
        height: 2200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();

    if (!normalized.length) {
      console.error("Nie udało się przygotować obrazu do PDF.", { bucket, path });
      return null;
    }

    return {
      data: normalized,
      format: "jpg",
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
