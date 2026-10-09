import { useEffect, useMemo, useRef } from "react";
import { Link } from "wouter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCatalog } from "@/lib/catalog/store";
import { homeProperties } from "@/lib/catalog/view";
import { CardSkeletons, LoadError } from "./CatalogState";
import { getActiveLenis, useStaticMotion } from "@/lib/motion";
import PropertyCard from "./PropertyCard";
import { useLang, useT } from "@/i18n/lang";

gsap.registerPlugin(ScrollTrigger);

const LOG = "[FeaturedStrip]";
/** تمرير لكل كارت ليعبر الشاشة كاملة: موبايل ≈ 1000px، لابتوب ≈ 2800px (أبطأ بطلب العميل؛ نفس سرعة الموبايل تقريباً) */
const SCROLL_PER_CARD = { mobile: 1000, desktop: 2800 };
/** أقصى فراغ قبل أول كارت وبعد آخر كارت بالصف المتحرك */
const STRIP_EDGE_MAX = 40;
/** بعد آخر حركة أفقية من الزائر بهذه المدة، يعود سكرول الصفحة ليقود الصف */
const USER_IDLE_MS = 180;

/**
 * «اختيارات تستحق الانتباه»: نفس كروت العقارات (PropertyCard) ونفس الاختيار (المميّز ثم الجديد، 4 بيوت)،
 * في صف أفقي يتحرك بطريقتين متطابقتين دائماً:
 *  - سكرول الصفحة لتحت/فوق: القسم يتثبّت (pin) والصف يتحرك من اليمين لليسار؛
 *  - السحب بالإصبع يمين/يسار (أو التراكباد / سحب الماوس): الصف نفسه نافذة سكرول أفقية حقيقية
 *    (سحب المتصفح الأصلي بزخمه الطبيعي) يعمل من أي مكان. وهو مثبّت يلحقه موضع الصفحة (فيبقيان متطابقين)؛
 *    قبل التثبيت أو بعده يتحرك الصف وحده والصفحة لا تتحرك.
 * بلا فراغ كبير قبل أو بعد: هامش الصف = هامش المحتوى على التلفون، وبحد أقصى 40px على الشاشات العريضة. بعد آخر كارت يفك التثبيت ويظهر «عرض كل البيوت».
 * النسخة الثابتة (تقليل الحركة / توفير البيانات): صف يتسحب بالإصبع (scroll-snap) بلا تثبيت.
 */
export function AvailableHomesStrip() {
  const { data, status, reload } = useCatalog();
  const lang = useLang();
  const t = useT();
  const dir = lang === "en" ? "ltr" : "rtl";
  // المنشور + المعروض بالرئيسية + غير المؤجّر، بترتيبه وبحد العدد من الإعدادات
  const selection = useMemo(() => (data ? homeProperties(data, lang) : []), [data, lang]);
  const { reduced } = useStaticMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const pinned = pinRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (reduced || !section || !pinned || !viewport || !track || selection.length === 0) return;

    const isMobile = () => window.matchMedia("(max-width: 760px)").matches;
    // أقصى سكرول أفقي للصف، بعد ضبط هامشه على هامش المحتوى (حافة العنوان).
    // إذا كل الكروت بتساع بالشاشة: الصف بالنص بالضبط وبلا حركة أفقية (ما في شي يتحرك له)
    const measure = () => {
      const head = pinned.querySelector<HTMLElement>(".hstrip__head");
      const gutter = head ? head.getBoundingClientRect().left + parseFloat(getComputedStyle(head).paddingLeft) : 16;
      const vw = viewport.clientWidth;
      const items = Array.from(track.children) as HTMLElement[];
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const content = items.reduce((sum, item) => sum + item.offsetWidth, 0) + gap * Math.max(0, items.length - 1);
      const fits = content + 32 <= vw;
      // هامش الصف عند البداية والنهاية: هامش المحتوى على التلفون، وبحد أقصى 40px على الشاشات العريضة
      // (هامش المحتوى هناك يصل 340px فيبقى فراغ كبير قبل أول كارت وبعد آخر كارت)
      const pad = fits ? Math.floor((vw - content) / 2) : Math.round(Math.min(gutter, STRIP_EDGE_MAX));
      track.style.paddingLeft = track.style.paddingRight = `${pad}px`;
      section.classList.toggle("hstrip--fits", fits);
      const cardW = items[0]?.offsetWidth ?? 0;
      const max = fits ? 0 : Math.max(0, viewport.scrollWidth - vw);
      return { vw, cardW, max };
    };
    let max = measure().max;

    // من يقود الآن: الزائر (سحب أفقي) أم سكرول الصفحة
    let userUntil = 0;
    const userActive = () => performance.now() < userUntil;
    const markUser = () => {
      userUntil = performance.now() + USER_IDLE_MS;
      gsap.killTweensOf(viewport); // الزائر يمسك الصف: نوقف أي انزلاق منّا
    };
    let touching = false;

    // الزائر سحب الصف وهو خارج التثبيت (قبله p0=0 أو بعده p0=1): نكمل من موضعه بلا رجوع ولا قفز —
    // الصف يتحرك خطياً من موضعه إلى الطرف الآخر مع سكرول الصفحة، وعند الوصول للطرف يعود الربط العادي
    let anchor: { p0: 0 | 1; left: number } | null = null;
    const rowFor = (progress: number) => {
      if (anchor && ((anchor.p0 === 0 && progress >= 1) || (anchor.p0 === 1 && progress <= 0))) anchor = null;
      if (!anchor) return progress * max;
      return anchor.p0 === 0 ? anchor.left + (max - anchor.left) * progress : anchor.left * progress;
    };
    const setRow = (progress: number) => {
      if (touching || userActive()) return;
      const target = rowFor(progress);
      // فرق كبير = الزائر سحب الصف وهو خارج مدى التثبيت؛ نرجعه بانزلاق ناعم لا بقفزة
      if (Math.abs(viewport.scrollLeft - target) > 40) {
        gsap.to(viewport, { scrollLeft: target, duration: 0.5, ease: "power2.out", overwrite: true });
      } else if (!gsap.isTweening(viewport)) viewport.scrollLeft = target;
    };

    const pinTop = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) - 12;
    const trigger = ScrollTrigger.create({
      trigger: pinned,
      pin: true,
      start: () => `top ${pinTop()}px`,
      end: () => {
        const m = measure();
        max = m.max;
        const perCard = isMobile() ? SCROLL_PER_CARD.mobile : SCROLL_PER_CARD.desktop;
        return `+=${Math.max(1, Math.round((m.max * perCard) / (m.vw + m.cardW)))}`;
      },
      invalidateOnRefresh: true,
      // بعد الهيرو: ارتفاعه يحدد موضع هذا القسم
      refreshPriority: -1,
      onUpdate: self => setRow(self.progress),
      onRefresh: self => setRow(self.progress),
    });
    triggerRef.current = trigger;

    // الزائر حرّك الصف أفقياً → موضع الصفحة يلحقه (فيكمل السكرول من نفس النقطة)
    const onRowScroll = () => {
      // كتاباتنا نحن (من سكرول الصفحة) تحدث فقط حين لا يقود الزائر، فتُتجاهل هنا
      if (!touching && !userActive()) return;
      if (!touching) markUser();
      if (max <= 0) return;
      // السحب الأفقي لا يحرّك الصفحة أبداً إلا والقسم مثبّت: قبل التثبيت أو بعده يتحرك الصف وحده
      // والزائر يبقى في مكانه (لا قفز لبداية القسم)
      const y = window.scrollY;
      if (y < trigger.start - 1 || y > trigger.end + 1) {
        anchor = { p0: y < trigger.start ? 0 : 1, left: viewport.scrollLeft };
        return;
      }
      anchor = null;
      const target = Math.round(trigger.start + (viewport.scrollLeft / max) * (trigger.end - trigger.start));
      getActiveLenis()?.scrollTo(target, { immediate: true, force: true });
      // Lenis قد يتجاهل الطلب أثناء/بعد اللمس مباشرة — نضمن الموضع بالسكرول الأصلي
      if (Math.abs(window.scrollY - target) > 1) window.scrollTo({ top: target, behavior: "instant" });
    };
    const onTouchStart = () => { touching = true; markUser(); };
    const onTouchEnd = () => { touching = false; markUser(); };
    // التراكباد الأفقي: المتصفح يحرّك الصف بنفسه، نحن فقط نعلّم أن الزائر هو من يقود
    const onWheel = (event: WheelEvent) => { if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) markUser(); };

    // سحب بالماوس على اللابتوب (اللمس يتولاه المتصفح)
    let drag: { x: number; left: number; moved: boolean } | null = null;
    let suppressClick = false;
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      drag = { x: event.clientX, left: viewport.scrollLeft, moved: false };
      suppressClick = false;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!drag || event.pointerType !== "mouse") return;
      const dx = event.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < 6) return;
      if (!drag.moved) { drag.moved = true; suppressClick = true; viewport.setPointerCapture?.(event.pointerId); }
      markUser();
      viewport.scrollLeft = drag.left - dx;
    };
    const onPointerUp = () => { drag = null; };
    const onClick = (event: MouseEvent) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    };
    const noDrag = (event: DragEvent) => event.preventDefault();

    viewport.addEventListener("scroll", onRowScroll, { passive: true });
    viewport.addEventListener("touchstart", onTouchStart, { passive: true });
    viewport.addEventListener("touchend", onTouchEnd, { passive: true });
    viewport.addEventListener("touchcancel", onTouchEnd, { passive: true });
    viewport.addEventListener("wheel", onWheel, { passive: true });
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("click", onClick, true);
    viewport.addEventListener("dragstart", noDrag);

    const m = measure();
    console.log(`${LOG} pinned cards: ${selection.length} homes, card ${m.cardW}px, travel ${Math.round(m.max)}px over ${Math.round(trigger.end - trigger.start)}px of scroll`);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      viewport.removeEventListener("scroll", onRowScroll);
      viewport.removeEventListener("touchstart", onTouchStart);
      viewport.removeEventListener("touchend", onTouchEnd);
      viewport.removeEventListener("touchcancel", onTouchEnd);
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("click", onClick, true);
      viewport.removeEventListener("dragstart", noDrag);
      triggerRef.current = null;
      trigger.kill(true);
      track.style.paddingLeft = track.style.paddingRight = "";
      section.classList.remove("hstrip--fits");
    };
  }, [reduced, selection.length]);

  // التركيز بالكيبورد أثناء التثبيت: نمرّر الصفحة حتى يكون الكارت المركّز عليه في منتصف الشاشة
  const revealOnFocus = (event: React.FocusEvent<HTMLElement>) => {
    const trigger = triggerRef.current;
    const viewport = viewportRef.current;
    if (!trigger || !viewport || !(event.target as HTMLElement).matches(":focus-visible")) return;
    const item = event.currentTarget;
    const max = viewport.scrollWidth - viewport.clientWidth;
    if (max <= 0) return;
    const progress = Math.min(1, Math.max(0, (item.offsetLeft + item.offsetWidth / 2 - viewport.clientWidth / 2) / max));
    const target = trigger.start + progress * (trigger.end - trigger.start);
    const lenis = getActiveLenis();
    if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
    else window.scrollTo({ top: target, behavior: "instant" });
  };

  // لا عقارات معروضة بالرئيسية: القسم لا يظهر أصلاً
  if (status === "ready" && selection.length === 0) return null;

  return (
    <section ref={sectionRef} className={`hstrip ${reduced ? "hstrip--static" : ""}`} aria-labelledby="hstrip-title">
      <div ref={pinRef} className="hstrip__inner">
        <div className="container hstrip__head">
          <h2 id="hstrip-title">{t("اختيارات تستحق الانتباه", "Homes worth a closer look")}</h2>
        </div>
        <div ref={viewportRef} className="hstrip__viewport">
          {/* المتحرك: الأول أقصى اليسار فيدخل أولاً من اليمين؛ الثابت: ترتيب اللغة العادي (العربي من اليمين) */}
          <div ref={trackRef} className="hstrip__track" dir={reduced ? dir : "ltr"}>
            {status === "loading" &&
              [0, 1, 2].map((i) => (
                <div className="hstrip__item" key={`skeleton-${i}`} dir={dir}>
                  <CardSkeletons count={1} />
                </div>
              ))}
            {selection.map(property => (
              <div className="hstrip__item" key={property.id} dir={dir} onFocus={revealOnFocus}>
                <PropertyCard property={property} gallery={false} />
              </div>
            ))}
          </div>
          {status === "error" && (
            <div className="container">
              <LoadError onRetry={reload} />
            </div>
          )}
        </div>
      </div>
      <div className="container section-cta hstrip__cta">
        <Link href="/properties" className="outline-button">
          {t("عرض كل البيوت", "View all homes")}
        </Link>
      </div>
    </section>
  );
}

export default AvailableHomesStrip;
