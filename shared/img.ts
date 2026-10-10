/**
 * صور العقارات عبر موقعنا: /img/<bucket>/<path> بدل رابط Supabase Storage المباشر.
 * Cloudflare (Pages Function: functions/img/[[path]].ts) يجلب الصورة من Supabase مرة واحدة لكل مركز بيانات
 * ويحفظها في الكاش سنة كاملة — أسماء الملفات المرفوعة لا تتغير أبداً (uuid)، فالصورة لا تتقادم.
 * مشترك بين Cloudflare وخادم Express المحلي (server/index.ts) والواجهة (رابط احتياطي مباشر).
 */

/** الـ buckets العامة المسموح بها فقط — المسار لا يصير بوابة مفتوحة لأي ملف آخر */
export const IMAGE_BUCKETS = ["property-images", "area-covers"] as const;

export const IMG_PREFIX = "/img/";

/** سنة كاملة، وimmutable: المتصفح لا يعيد السؤال عنها أبداً */
export const IMG_CACHE_CONTROL = "public, max-age=31536000, immutable";

/** <bucket>/<uuid>/<uuid>-1080.webp … حروف آمنة فقط، بلا .. ولا // */
const SAFE_PATH = /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]+)+$/;

/** المسار داخل التخزين من رابط /img/… ، أو null إن لم يكن مسموحاً */
export function storagePathFromImg(pathname: string): string | null {
  if (!pathname.startsWith(IMG_PREFIX)) return null;
  let rest: string;
  try {
    rest = decodeURIComponent(pathname.slice(IMG_PREFIX.length));
  } catch {
    return null;
  }
  if (!SAFE_PATH.test(rest) || rest.includes("..")) return null;
  const bucket = rest.split("/")[0];
  return (IMAGE_BUCKETS as readonly string[]).includes(bucket) ? rest : null;
}

/** الرابط المباشر في Supabase Storage لملف عام */
export const directImageUrl = (supabaseUrl: string, storagePath: string) =>
  `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${storagePath}`;

/** رابط الصورة عبر موقعنا (نسبي، فيعمل على أي دومين) */
export const imgUrl = (bucket: string, path: string) => `${IMG_PREFIX}${bucket}/${path}`;
