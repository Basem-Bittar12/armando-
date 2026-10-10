/**
 * إعدادات Supabase للموقع العام بدون مكتبة supabase-js: الموقع يقرأ عبر REST مباشرة (fetch) فيبقى ملفه خفيفاً،
 * ومكتبة supabase-js تُحمَّل فقط مع لوحة التحكم (الدخول والكتابة).
 * المفتاح العام (anon) فقط — الحماية بقواعد RLS. مفتاح service_role ممنوع بأي ملف بالواجهة.
 */
import { imgUrl } from "@shared/img";
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim().replace(/\/$/, "") ?? "";
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const IMAGES_BUCKET = "property-images";
export const AREA_COVERS_BUCKET = "area-covers";

/**
 * رابط ملف داخل bucket عام — دائماً عبر موقعنا (/img/…): Cloudflare يحفظ الصورة في كاشه سنة،
 * فلا تُستهلك حصة النقل الشهرية في Supabase مع كل زائر (shared/img.ts، functions/img).
 */
export const publicUrl = (bucket: string, path: string) => imgUrl(bucket, path);

/** جلسة المسؤول (تسجّلها لوحة التحكم بعد الدخول) حتى يقرأ المسودات والخيارات الموقوفة */
let accessToken: (() => Promise<string | null>) | null = null;
export const setAccessTokenProvider = (provider: (() => Promise<string | null>) | null) => {
  accessToken = provider;
};

export type RestError = { message: string; code?: string };

/** طلب REST (PostgREST) بالمفتاح العام أو بجلسة المسؤول إن وُجدت */
export async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = (await accessToken?.().catch(() => null)) ?? SUPABASE_ANON_KEY;
  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, Accept: "application/json", ...(init.headers ?? {}) },
    });
  } catch (error) {
    throw { message: `Failed to fetch: ${(error as Error).message}` } satisfies RestError;
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Partial<RestError>;
    throw { message: body.message ?? `HTTP ${response.status}`, code: body.code } satisfies RestError;
  }
  if (response.status === 201 || response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
