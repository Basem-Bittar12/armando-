/**
 * احتياط لصور /img: إن فشل المسار (مثلاً تجاوز الحد اليومي المجاني لـ Cloudflare Functions،
 * فيرد الموقع بصفحة HTML بدل الصورة) تُحمَّل نفس الصورة مباشرة من Supabase Storage. مرة واحدة لكل صورة.
 */
import { IMG_PREFIX } from "@shared/img";
import { SUPABASE_URL } from "./supabaseConfig";

const direct = () => `${SUPABASE_URL}/storage/v1/object/public/`;

/** يبدّل كل رابط /img/… (نسبي أو كامل على نفس الموقع) في src أو srcset بالرابط المباشر */
export function toDirectImageUrls(value: string, origin: string) {
  const escaped = origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return value.replace(new RegExp(`(^|,\\s*)(?:${escaped})?${IMG_PREFIX}`, "g"), `$1${direct()}`);
}

export function installImgFallback() {
  if (!SUPABASE_URL) return;
  document.addEventListener(
    "error",
    (event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement) || img.dataset.imgFallback) return;
      const origin = window.location.origin;
      if (!img.src.startsWith(origin + IMG_PREFIX)) return;
      img.dataset.imgFallback = "1";
      if (img.srcset) img.srcset = toDirectImageUrls(img.srcset, origin);
      img.src = toDirectImageUrls(img.src, origin);
    },
    true,
  );
}
