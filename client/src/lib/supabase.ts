/**
 * عميل supabase-js — للوحة التحكم فقط (الدخول، الرفع، الكتابة). الموقع العام يقرأ عبر supabaseConfig.ts (REST).
 * المفتاح العام (anon) فقط؛ مفتاح service_role ممنوع هنا أو بأي ملف بالواجهة (scripts/check-bundle.ts).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "./supabaseConfig";

export { AREA_COVERS_BUCKET, IMAGES_BUCKET, publicUrl, supabaseConfigured } from "./supabaseConfig";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseConfigured) throw new Error("Supabase غير مربوط (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "aahh-admin-session" },
    });
  }
  return client;
}
