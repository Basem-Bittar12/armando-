/**
 * عميل Supabase للمتصفح — بالمفتاح العام (anon) فقط. الحماية الفعلية بقواعد RLS بالقاعدة.
 * مفتاح service_role ممنوع يدخل هنا أو أي ملف بالواجهة (يُفحص بعد كل build: scripts/check-bundle.ts).
 * بدون VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY يشتغل الموقع على البيانات التجريبية بالذاكرة.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim().replace(/\/$/, "");
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const supabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseConfigured) throw new Error("Supabase غير مربوط (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "aahh-admin-session" },
    });
  }
  return client;
}

export const IMAGES_BUCKET = "property-images";
export const AREA_COVERS_BUCKET = "area-covers";

/** الرابط العام لملف داخل bucket عام */
export const publicUrl = (bucket: string, path: string) => `${url}/storage/v1/object/public/${bucket}/${path}`;
