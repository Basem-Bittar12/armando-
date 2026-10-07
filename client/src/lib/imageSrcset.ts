/**
 * srcset لصور Unsplash: نفس الصورة بعروض مختلفة عبر معامل w= في الرابط.
 * أي رابط آخر (صور مرفوعة لاحقاً) يُعاد بلا srcset.
 */
const WIDTHS = [480, 640, 800, 1080, 1280];

export function srcsetFor(url: string) {
  if (!/images\.unsplash\.com/.test(url) || !/[?&]w=\d+/.test(url)) return { src: url };
  const at = (width: number) => url.replace(/([?&]w=)\d+/, `$1${width}`);
  return { src: at(800), srcSet: WIDTHS.map((width) => `${at(width)} ${width}w`).join(", ") };
}
