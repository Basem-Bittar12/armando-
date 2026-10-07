/**
 * srcset للصور:
 *  - صور لوحة التحكم (Supabase): ثلاث نسخ WebP بأسماء …-640.webp / …-1080.webp / …-1600.webp
 *  - صور Unsplash التجريبية: نفس الصورة بعروض مختلفة عبر معامل w= في الرابط.
 * أي رابط آخر (معاينة محلية blob:) يُعاد بلا srcset.
 */
const UNSPLASH_WIDTHS = [480, 640, 800, 1080, 1280];
const UPLOAD_WIDTHS = [640, 1080, 1600];

export function srcsetFor(url: string) {
  const upload = /-(640|1080|1600)\.webp(\?.*)?$/.exec(url);
  if (upload) {
    const at = (width: number) => url.replace(/-(640|1080|1600)\.webp/, `-${width}.webp`);
    return { src: at(1080), srcSet: UPLOAD_WIDTHS.map((width) => `${at(width)} ${width}w`).join(", ") };
  }
  if (!/images\.unsplash\.com/.test(url) || !/[?&]w=\d+/.test(url)) return { src: url };
  const at = (width: number) => url.replace(/([?&]w=)\d+/, `$1${width}`);
  return { src: at(800), srcSet: UNSPLASH_WIDTHS.map((width) => `${at(width)} ${width}w`).join(", ") };
}
