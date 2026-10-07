import { useEffect, useState } from "react";
import type Lenis from "lenis";

/**
 * تفضيلات الحركة المشتركة بين الأقسام المتحركة (الهيرو، شريط البيوت المتاحة) وسجلّ Lenis.
 */

export const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

export const readReduced = () => typeof window !== "undefined" && window.matchMedia(REDUCED_QUERY).matches;

/** توفير البيانات أو اتصال بطيء: النسخة الثابتة بلا حركة */
export function readLiteConnection() {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(connection?.saveData) || /^(slow-2g|2g|3g)$/.test(connection?.effectiveType ?? "");
}

/** يتابع media query ويعيد القيمة الحالية — التغيير يصل فقط عند عبور الحد فعلاً */
export function useMediaFlag<T>(query: string, read: () => T) {
  const [value, setValue] = useState(read);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setValue(read());
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [query, read]);
  return value;
}

/** النسخة الثابتة لأي سبب: تقليل الحركة، توفير البيانات، أو نت بطيء */
export function useStaticMotion() {
  const reducedMotion = useMediaFlag(REDUCED_QUERY, readReduced);
  const [lite] = useState(readLiteConnection);
  return { reduced: reducedMotion || lite, reducedMotion, lite };
}

/* ---------- سجلّ Lenis: الهيرو ينشئه، والأقسام الأخرى توقفه وتشغّله (المعرض المكبّر) ---------- */
let activeLenis: Lenis | null = null;

export const setActiveLenis = (lenis: Lenis | null) => {
  activeLenis = lenis;
};
export const getActiveLenis = () => activeLenis;

/** إيقاف التمرير (معرض مفتوح): Lenis.stop، ومنع تمرير الصفحة الأصلي أيضاً */
export function pauseScroll() {
  activeLenis?.stop();
  document.documentElement.style.overflow = "hidden";
}

/** استئناف التمرير والرجوع لنفس الموضع بالضبط (فتكمل الحركة المربوطة بالسكرول من نفس النقطة) */
export function resumeScroll(y: number) {
  document.documentElement.style.overflow = "";
  activeLenis?.start();
  if (Math.abs(window.scrollY - y) > 1) {
    if (activeLenis) activeLenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo({ top: y, behavior: "instant" });
  }
}
