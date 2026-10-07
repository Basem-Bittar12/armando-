/**
 * تصغير صورة لثلاث نسخ WebP (640 / 1080 / 1600 عرض) ورفعها — نفس المقاسات التي تستعملها لوحة التحكم بالمتصفح.
 */
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";

export const IMAGE_WIDTHS = [640, 1080, 1600] as const;
export const IMAGES_BUCKET = "property-images";

export async function uploadImageSet(client: SupabaseClient, source: Buffer, folder: string, name: string) {
  const meta = await sharp(source).metadata();
  const paths: Record<number, string> = {};
  for (const width of IMAGE_WIDTHS) {
    const body = await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    const path = `${folder}/${name}-${width}.webp`;
    const { error } = await client.storage.from(IMAGES_BUCKET).upload(path, body, { contentType: "image/webp", upsert: true });
    if (error) throw new Error(`رفع ${path}: ${error.message}`);
    paths[width] = path;
  }
  return { path_640: paths[640], path_1080: paths[1080], path_1600: paths[1600], width: meta.width ?? null, height: meta.height ?? null };
}
