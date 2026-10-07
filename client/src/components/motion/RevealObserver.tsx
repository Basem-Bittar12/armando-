import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "wouter";

/**
 * ظهور هادئ عند التمرير — مراقب واحد للموقع كله بدل مكوّن لكل عنصر.
 *
 * الموقع العام: كل قسم كامل يظهر بتلاشٍ بسيط مرة واحدة فقط أول ما تدخل حافته الشاشة
 * (لا حركة لكل كارت، ولا ارتباط بالسكرول — السكرول المربوط موجود في الهيرو فقط).
 * لوحة المكتب: نفس السلوك على بطاقاتها.
 *
 * العناصر تُخفى قبل أول رسم ثم تظهر، وبعد انتهاء الحركة تُزال السمات فيعود العنصر لتنسيقه.
 * لا يعمل إطلاقاً (والمحتوى ظاهر كما هو) إذا كان المستخدم مفعّلاً تقليل الحركة،
 * أو إذا لم يدعم المتصفح IntersectionObserver.
 */
const SELECTOR = [
  // الموقع العام — مستوى القسم فقط
  ".search-section",
  "main .section",
  ".listing-toolbar",
  ".property-grid--listing",
  ".empty-state",
  ".detail-layout",
  ".detail-extra",
  ".contact-layout",
  ".notfound-page",
  ".site-footer",
  // لوحة المكتب
  ".admin-welcome-card",
  ".stat-card",
  ".admin-panel",
  ".media-tile",
].join(",");

const DURATION_MS = 500;

const seen = new WeakSet<Element>();
let observer: IntersectionObserver | null = null;

function motionAllowed() {
  return (
    typeof window !== "undefined" &&
    "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function reveal(entries: IntersectionObserverEntry[]) {
  entries
    .filter((entry) => entry.isIntersecting)
    .forEach((entry) => {
      const el = entry.target as HTMLElement;
      observer?.unobserve(el);
      el.setAttribute("data-revealed", "");
      window.setTimeout(() => {
        el.removeAttribute("data-reveal");
        el.removeAttribute("data-revealed");
      }, DURATION_MS + 80);
    });
}

function scan() {
  if (!motionAllowed()) return;
  // threshold 0: يبدأ الظهور في نفس الإطار الذي تعبر فيه حافة القسم حافة الشاشة
  observer ??= new IntersectionObserver(reveal, { rootMargin: "0px", threshold: 0 });
  document.querySelectorAll(SELECTOR).forEach((el) => {
    if (seen.has(el)) return;
    seen.add(el);
    el.setAttribute("data-reveal", "");
    observer!.observe(el);
  });
}

export function RevealObserver() {
  const [location] = useLocation();

  // قبل الرسم: حتى لا يومض المحتوى ظاهراً ثم يختفي ثم يظهر
  useLayoutEffect(() => {
    scan();
  }, [location]);

  // الأقسام التي تُضاف لاحقاً (الحالة الفارغة، العقارات المشابهة، تبويبات اللوحة)
  useEffect(() => {
    if (!motionAllowed()) return;
    const mutations = new MutationObserver(() => scan());
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => mutations.disconnect();
  }, []);

  return null;
}

export default RevealObserver;
