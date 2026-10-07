import { useEffect, useRef } from "react";
import { Link } from "wouter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { heroStory } from "@/config/site";
import { setActiveLenis, useMediaFlag, useStaticMotion } from "@/lib/motion";
import WhatsAppButton from "./WhatsAppButton";

gsap.registerPlugin(ScrollTrigger);
// سفاري الآيفون: ظهور/اختفاء شريط العنوان يغيّر ارتفاع الشاشة؛ لا نعيد حساب المسافات بسببه
ScrollTrigger.config({ ignoreMobileResize: true });

/**
 * هيرو الصفحة الرئيسية: غرفة فارغة يسقط فيها الأثاث قطعة قطعة، مرسومة على canvas حسب تقدّم السكرول.
 * - مجموعتا فريمات: أفقية (لابتوب) وعمودية (موبايل/تابلت واقف). الاختيار حسب اتجاه الشاشة لا عرضها،
 *   ويُحمَّل فقط ما يناسب الاتجاه الحالي.
 * - القصة تتراكم: كل جملة تدخل (تلاشٍ + نزول 10px) وتبقى، ثم اللوغو والزر (اللابتوب) أو الزر
 *   وحده (الموبايل). منطقة النص تُحسب من موقع الفريم الفعلي على الشاشة بعد cover.
 * - الموبايل: الأثاث يسقط من أعلى الكادر فيمرّ خلف النص؛ تدرّج Almond خلف النص فقط يبقيه مقروءاً.
 * - الوضع الثابت (تقليل الحركة، أو Save-Data، أو نت بطيء 2G/3G): الفريم الأخير مع القصة كاملة
 *   مباشرة — لا يُحمَّل غير فريم واحد.
 * - الفريمات WebP (أصغر بنحو 35% من JPG بنفس الجودة)، والأول يُحمَّل مسبقاً من index.html.
 */

type Device = "desktop" | "mobile";

type FrameSet = {
  dir: string;
  count: number;
  /** معدّل الفريمات المستخرجة (كل فريم ثانٍ من فيديو 24fps) */
  fps: number;
  width: number;
  height: number;
  /**
   * منطقة النص كنسبة من الفريم:
   * right — الجدار المنفصل من from حتى الحافة اليمنى (اللابتوب)، النص فوق الفيديو.
   * split — الموبايل: الفيديو في الجزء العلوي بعرض الشاشة تماماً (لا قصّ من الجانبين: الكنباية تمتد
   *   من 6.7% إلى 99.6% من العرض)، وأسفل الفريم ملتصق بأسفل الجزء فيكون القصّ من الأعلى فقط.
   *   safeFrom: أبعد نقطة يجوز أن يبدأ منها الظاهر دون أن يُقصّ شيء من الكنباية ومخداتها أو الطاولة.
   *   النص في شريط Almond تحته لا يمرّ فيه شيء.
   */
  zone: { kind: "right"; from: number } | { kind: "split"; safeFrom: number };
  /** تقدّم السكرول ← زمن الفيديو بالثواني، خطّياً بين النقاط */
  timeline: readonly (readonly [progress: number, seconds: number])[];
};

/*
 * التوقيت مقاس من الفيديوهين فريماً فريماً. الاستراحات بين القطع:
 * 1.80 ث (بعد الكنباية) · 3.30 (بعد الطاولة) · 4.6–4.7 (بعد المخدات) · 6.17 (اكتمال الغرفة).
 * اللابتوب: لا تدخل أي قطعة الجدار الأيمن (57%→100%) في أي فريم.
 * الموبايل: القطع تسقط من الحافة العليا لجزء الفيديو؛ النص في شريط مستقل تحته.
 * الفريمات: 0 → 6.92 ث (84 فريماً) — الحركة تنتهي عند 6.17 ث وبعدها 0.75 ث ثبات.
 */
const FRAME_SETS: Record<Device, FrameSet> = {
  desktop: {
    dir: "/hero-frames/desktop",
    count: 84,
    fps: 12,
    width: 1280,
    height: 720,
    zone: { kind: "right", from: 0.57 },
    timeline: [[0, 0], [0.2, 1.8], [0.41, 3.3], [0.57, 4.7], [0.78, 6.17], [1, 6.92]],
  },
  mobile: {
    dir: "/hero-frames/mobile",
    count: 84,
    fps: 12,
    width: 720,
    height: 1280,
    // مقاس من الفريمات: إطار اللوحة 36.9%–62%، أعلى الكنباية 73.8% (المخدات فوقها بقليل)، آخر الطاولة 96.7%.
    // القصّ من الأعلى حتى 69% يأكل من اللوحة فقط
    zone: { kind: "split", safeFrom: 0.69 },
    timeline: [[0, 0], [0.2, 1.8], [0.41, 3.3], [0.57, 4.6], [0.78, 6.17], [1, 6.92]],
  },
};

/**
 * متى يدخل كل عنصر من القصة (ويبقى حتى آخر الهيرو) — نفسه للجهازين:
 * العنوان (H1) من البداية، جزءا الجملة 20% و41%، ثم زر «تصفّح البيوت» 78%.
 * سطر الاسم وزر واتساب ظاهران من أول لحظة (بلا data-story).
 */
const STORY_ENTER = [0, 0.2, 0.41, 0.78] as const;

/** عمودي ← فيديو الموبايل (يشمل التابلت الواقف)، أفقي ← فيديو اللابتوب */
const PORTRAIT_QUERY = "(orientation: portrait)";
const BACKGROUND_CONCURRENCY = 6;
/** طول دخول كل عنصر، كنسبة من مسافة الهيرو */
const FADE = 0.03;
/** النزول الخفيف عند الدخول */
const ENTER_SHIFT_PX = 10;
const LOG = "[HeroCanvas]";

const frameUrl = (device: Device, index: number) =>
  `${FRAME_SETS[device].dir}/${String(index + 1).padStart(3, "0")}.webp`;

const isReady = (img: HTMLImageElement | undefined): boolean =>
  !!img && img.complete && img.naturalWidth > 0;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** تقدّم السكرول ← رقم الفريم عبر timeline */
function frameAt(set: FrameSet, progress: number) {
  const points = set.timeline;
  let seconds = points[points.length - 1][1];
  for (let i = 1; i < points.length; i++) {
    const [p1, t1] = points[i];
    if (progress <= p1) {
      const [p0, t0] = points[i - 1];
      seconds = t0 + ((progress - p0) / (p1 - p0 || 1)) * (t1 - t0);
      break;
    }
  }
  return Math.min(set.count - 1, Math.max(0, Math.round(seconds * set.fps)));
}

/** مقدار دخول عنصر (0 → 1) — دالّة في التقدّم وحده، فالرجوع لفوق يُخرج العناصر بالترتيب المعاكس */
const enterAmount = (from: number, progress: number) => (from <= 0 ? 1 : clamp01((progress - from) / FADE));

/**
 * موقع الفريم على الشاشة ومنطقة النص (بالبكسل CSS).
 * اللابتوب: cover على المسرح كله بلا أي تكبير إضافي، والنص على الجدار الأيمن.
 * الموبايل: الفيديو في الجزء العلوي بارتفاع videoHeight (ما يتبقى فوق شريط النص)، بعرض الشاشة تماماً،
 * وأسفل الفريم ملتصق بأسفل الجزء فيكون القصّ من الأعلى فقط.
 */
function frameGeometry(set: FrameSet, stageWidth: number, stageHeight: number, videoHeight = stageHeight) {
  const zone = set.zone;
  if (zone.kind === "split") {
    const scale = stageWidth / set.width;
    const w = set.width * scale;
    const h = set.height * scale;
    return { x: (stageWidth - w) / 2, y: videoHeight - h, w, h, zone: { x: 0, y: videoHeight, w: stageWidth, h: stageHeight - videoHeight } };
  }
  const scale = Math.max(stageWidth / set.width, stageHeight / set.height);
  const w = set.width * scale;
  const h = set.height * scale;
  const x = (stageWidth - w) / 2;
  const y = (stageHeight - h) / 2;
  const left = Math.max(0, x + zone.from * w);
  const right = Math.min(stageWidth, x + w);
  return { x, y, w, h, zone: { x: left, y: 0, w: right - left, h: stageHeight } };
}

/**
 * محمّل لكل جهاز، يعيش على مستوى الوحدة: لو تغيّر اتجاه الشاشة ثم رجع،
 * أو خرج الزائر من الرئيسية ورجع، تُستعمل نفس الصور بدل تحميلها من جديد.
 */
class FrameLoader {
  readonly images: HTMLImageElement[] = [];
  private queue: number[] = [];
  private inFlight = 0;
  private loaded = 0;
  private active = false;
  onFrameLoad: ((index: number) => void) | null = null;

  constructor(readonly device: Device) {}

  get count() {
    return FRAME_SETS[this.device].count;
  }

  /** يطلب فريماً واحداً بأولوية عالية (الأول، أو الأخير في الوضع الثابت) */
  loadPriority(index: number) {
    return new Promise<void>((resolve) => {
      const existing = this.images[index];
      if (isReady(existing)) return resolve();
      const img = existing ?? this.create(index, "high");
      img.addEventListener("load", () => resolve(), { once: true });
      img.addEventListener("error", () => resolve(), { once: true });
    });
  }

  /** يكمّل بقية الفريمات بالخلفية، عدد محدود بالتوازي حتى لا يزاحم باقي الصفحة */
  startBackground() {
    this.active = true;
    if (this.queue.length === 0 && this.loaded + this.inFlight < this.count) {
      for (let i = 0; i < this.count; i++) if (!this.images[i]) this.queue.push(i);
    }
    this.pump();
  }

  /** عند تبديل الاتجاه: لا طلبات جديدة لهذه المجموعة (الجارية تكمل وتبقى في الذاكرة) */
  pause() {
    this.active = false;
  }

  private pump() {
    while (this.active && this.inFlight < BACKGROUND_CONCURRENCY && this.queue.length) {
      const index = this.queue.shift()!;
      if (this.images[index]) continue;
      this.create(index, "low");
    }
  }

  private create(index: number, priority: "high" | "low") {
    const img = new Image();
    img.decoding = "async";
    (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = priority;
    this.images[index] = img;
    this.inFlight++;
    img.onload = () => {
      this.inFlight--;
      this.loaded++;
      this.onFrameLoad?.(index);
      if (this.loaded === this.count) {
        console.log(`${LOG} ${this.device}: all ${this.count} frames loaded`);
      }
      this.pump();
    };
    img.onerror = () => {
      this.inFlight--;
      console.error(`${LOG} ${this.device}: failed to load frame ${index + 1} (${img.src})`);
      this.pump();
    };
    img.src = frameUrl(this.device, index);
    return img;
  }
}

const loaders: Partial<Record<Device, FrameLoader>> = {};
const getLoader = (device: Device) => (loaders[device] ??= new FrameLoader(device));

const readDevice = (): Device =>
  typeof window !== "undefined" && window.matchMedia(PORTRAIT_QUERY).matches ? "mobile" : "desktop";
export default function HeroCanvas() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const device = useMediaFlag(PORTRAIT_QUERY, readDevice);
  // "reduced" هنا = الوضع الثابت لأي سبب من الأسباب الثلاثة (lib/motion.ts)
  const { reduced, reducedMotion, lite } = useStaticMotion();

  // Lenis: سكرول ناعم يغذي ScrollTrigger — فقط لمن لم يطلب تقليل الحركة
  useEffect(() => {
    if (reduced) return;
    let lenis: Lenis;
    try {
      lenis = new Lenis({ lerp: 0.1 });
    } catch (error) {
      // متصفح قديم (أو jsdom) بلا ResizeObserver — السكرول العادي يكفي وScrollTrigger يعمل عليه
      console.error(`${LOG} Lenis failed to start, falling back to native scroll`, error);
      return;
    }
    lenisRef.current = lenis;
    setActiveLenis(lenis);
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    console.log(`${LOG} Lenis smooth scroll started`);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenisRef.current = null;
      setActiveLenis(null);
      lenis.destroy();
      console.log(`${LOG} Lenis destroyed`);
    };
  }, [reduced]);

  // أي دخول للرئيسية يبدأ من أول القصة: عند التركيب (قادم من صفحة أخرى أو تحديث)، وعند كبسة أي رابط
  // للرئيسية وأنت فيها أصلاً (اللوغو) — wouter لا يفعل شيئاً عند الانتقال لنفس المسار
  useEffect(() => {
    const toTop = (reason: string) => {
      window.scrollTo({ top: 0, behavior: "instant" });
      lenisRef.current?.scrollTo(0, { immediate: true, force: true });
      requestAnimationFrame(() => ScrollTrigger.refresh());
      console.log(`${LOG} back to the start of the story (${reason})`);
    };
    toTop("entered home");
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href="/"]');
      if (link && window.location.pathname === "/" && !event.metaKey && !event.ctrlKey) toTop("home link clicked on home");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [reduced]);

  // تحميل الفريمات + الرسم + القصة + ScrollTrigger — يُعاد فقط عند تغيّر الاتجاه أو الوضع الثابت
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!section || !stage || !canvas) return;

    const set = FRAME_SETS[device];
    const story = Array.from(stage.querySelectorAll<HTMLElement>("[data-story]"));
    const loader = getLoader(device);
    const last = loader.count - 1;
    let progress = reduced ? 1 : 0;
    let geometry = frameGeometry(set, stage.clientWidth || 1, stage.clientHeight || 1);
    let drawnIndex = -1;
    let rafId = 0;
    let disposed = false;
    console.log(`${LOG} device=${device} frames=${loader.count}`);
    if (reduced) {
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      const reasons = [
        reducedMotion && "تقليل الحركة مفعّل في النظام (prefers-reduced-motion — في ويندوز: تأثيرات الحركة مطفأة)",
        connection?.saveData && "توفير البيانات (Save-Data)",
        lite && !connection?.saveData && `اتصال بطيء (${connection?.effectiveType})`,
      ].filter(Boolean);
      console.log(`${LOG} النسخة الثابتة تظهر بسبب: ${reasons.join(" + ")}`);
    }

    // القصة تتراكم: كل عنصر يدخل بتلاشٍ ونزول خفيف ويبقى؛ ما قبله لا يتحرك
    const applyStory = () => {
      story.forEach((el, i) => {
        const amount = enterAmount(STORY_ENTER[i] ?? 2, progress);
        el.style.opacity = amount.toFixed(3);
        const shift = amount >= 1 ? "" : `${(-(1 - amount) * ENTER_SHIFT_PX).toFixed(2)}px`;
        // transform لا يعمل على عنصر inline (جزءا الجملة على الموبايل)، فيتحرك بـ top النسبي
        if (el.tagName === "SPAN") el.style.top = shift;
        else el.style.transform = shift ? `translate3d(0, ${shift}, 0)` : "";
        // المخفي تماماً لا يُضغط ولا يُوصل له بالكيبورد
        el.style.visibility = amount < 0.01 ? "hidden" : "visible";
      });
    };

    // حجم خط الجمل: الأعلى المسموح، ثم يصغر حتى 26px إن لم تتسع القصة كاملة في منطقتها.
    // العناصر المخفية تحجز مكانها، فالقياس يشمل القصة كلها من أول لحظة (لا قفزات لاحقاً)
    const zoneBox = stage.querySelector<HTMLElement>(".hero-zone");
    // الموبايل: ارتفاع جزء الفيديو = المسرح ناقص شريط النص. الشريط بارتفاع محتواه النهائي (كل العناصر
    // تحجز مكانها من البداية فلا يقفز حين تُضاف الجمل)، والفيديو يأخذ كل ما تبقى — حتى ارتفاع الفريم
    // كاملاً؛ إن زاد المسرح عن ذلك يكبر الشريط بدل أن يُكبَّر الفريم ويُقصّ من الجانبين
    let lastVideoHeight = -1;
    const fitMobile = () => {
      if (!zoneBox || set.zone.kind !== "split") return;
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      const frameHeight = set.height * (width / set.width);
      zoneBox.style.minHeight = "";
      let videoHeight = height - zoneBox.offsetHeight;
      if (videoHeight > frameHeight) {
        videoHeight = frameHeight;
        zoneBox.style.minHeight = `${Math.ceil(height - frameHeight)}px`;
      }
      if (Math.abs(videoHeight - lastVideoHeight) < 1) return;
      lastVideoHeight = videoHeight;
      geometry = frameGeometry(set, width, height, videoHeight);
      for (const [name, value] of Object.entries({ "frame-x": geometry.x, "frame-y": geometry.y, "frame-w": geometry.w, "frame-h": geometry.h, "zone-y": geometry.zone.y, "zone-h": geometry.zone.h })) {
        stage.style.setProperty(`--${name}`, `${value.toFixed(1)}px`);
      }
      const shownFrom = -geometry.y / geometry.h;
      stage.dataset.shownFrom = (shownFrom * 100).toFixed(1);
      const cut = shownFrom <= 0.369 ? "nothing cut (painting frame complete)" : shownFrom <= set.zone.safeFrom ? "top of the painting cut — sofa and table complete" : "⚠ the sofa is cut — the text band is too tall for this screen";
      const log = shownFrom > set.zone.safeFrom ? console.error : console.log;
      log(`${LOG} mobile split: video ${Math.round(videoHeight)}px (${Math.round((videoHeight / height) * 100)}% of the hero), text band ${zoneBox.offsetHeight}px · frame shown from ${(shownFrom * 100).toFixed(1)}% of its height — ${cut}`);
      requestDraw(true);
    };
    const fitStory = () => {
      if (set.zone.kind === "split") fitMobile();
    };

    const ctx = canvas.getContext("2d");
    if (!ctx) console.error(`${LOG} canvas 2D context unavailable — hero stays on its Almond background`);

    // أقرب فريم محمَّل للفريم المطلوب، حتى لا يفرغ الكانفاس أثناء التحميل التدريجي
    const nearestReady = (target: number) => {
      for (let d = 0; d <= last; d++) {
        if (isReady(loader.images[target - d])) return target - d;
        if (isReady(loader.images[target + d])) return target + d;
      }
      return -1;
    };

    const draw = () => {
      rafId = 0;
      if (!ctx) return;
      const index = nearestReady(frameAt(set, progress));
      if (index < 0 || index === drawnIndex) return;
      const dpr = canvas.width / (stage.clientWidth || 1);
      const { x, y, w, h } = geometry;
      ctx.drawImage(loader.images[index], x * dpr, y * dpr, w * dpr, h * dpr);
      drawnIndex = index;
    };
    const requestDraw = (force = false) => {
      if (force) drawnIndex = -1;
      if (!rafId) rafId = requestAnimationFrame(draw);
    };

    let laidOut = { width: 0, height: 0 };
    const layout = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      if (!width || !height) return;
      // تغيّر الارتفاع وحده بفرق صغير = شريط عنوان الموبايل؛ لا نعيد بناء الكانفاس (لا قفزة)
      if (width === laidOut.width && Math.abs(height - laidOut.height) < 160) return;
      laidOut = { width, height };
      lastVideoHeight = -1;
      geometry = frameGeometry(set, width, height);
      // دقة الكانفاس بحد أقصى devicePixelRatio = 2
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      if (ctx) ctx.imageSmoothingQuality = "high";
      // منطقة النص تُمرَّر لـ CSS، فتجلس القصة فوق الجدار الفارغ مهما كان مقاس الشاشة
      const { x, y, w, h, zone } = geometry;
      for (const [name, value] of Object.entries({ "frame-x": x, "frame-y": y, "frame-w": w, "frame-h": h, "zone-x": zone.x, "zone-y": zone.y, "zone-w": zone.w, "zone-h": zone.h })) {
        stage.style.setProperty(`--${name}`, `${value.toFixed(1)}px`);
      }
      fitStory();
      requestDraw(true);
    };
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { layout(); fitStory(); }) : null;
    resizeObserver?.observe(stage);
    // الموبايل: ارتفاع شريط النص يتغير مع وصول الخطوط؛ نعيد حساب جزء الفيديو حينها
    if (set.zone.kind === "split" && zoneBox) resizeObserver?.observe(zoneBox);
    layout();
    applyStory();
    // الخطوط تصل متأخرة قليلاً وتغيّر ارتفاع شريط النص (موبايل): نعيد الحساب بعد كل خط يصل
    document.fonts?.ready.then(() => {
      if (!disposed) fitStory();
    });
    const refit = () => !disposed && fitStory();
    document.fonts?.addEventListener("loadingdone", refit);
    window.addEventListener("load", refit);

    // كل صورة تخلص تحميل → إعادة رسم لو صارت أقرب للفريم المطلوب من المرسوم حالياً
    loader.onFrameLoad = (index) => {
      const target = frameAt(set, progress);
      if (drawnIndex < 0 || Math.abs(index - target) < Math.abs(drawnIndex - target)) requestDraw(true);
    };

    let trigger: ScrollTrigger | null = null;
    const priorityIndex = reduced ? last : 0;
    const t0 = performance.now();
    loader.loadPriority(priorityIndex).then(() => {
      if (disposed) return;
      const ok = isReady(loader.images[priorityIndex]);
      if (ok) console.log(`${LOG} ${device}: priority frame ${priorityIndex + 1} ready in ${Math.round(performance.now() - t0)}ms`);
      else console.error(`${LOG} ${device}: priority frame ${priorityIndex + 1} failed to load`);
      requestDraw(true);
      if (!reduced) loader.startBackground();
    });

    if (reduced) {
      console.log(`${LOG} static mode (reduced motion / save-data / slow network): final frame with the full story, no ScrollTrigger`);
    } else {
      trigger = ScrollTrigger.create({
        trigger: section,
        // المقطع يبدأ تحت الهيدر؛ نفس الإزاحة التي يستخدمها CSS للـsticky
        start: () => `top ${parseFloat(getComputedStyle(section).getPropertyValue("--hero-canvas-top")) || 0}px`,
        end: "bottom bottom",
        invalidateOnRefresh: true,
        // يُحسب قبل شريط البيوت المتاحة (الأقسام المثبّتة تحته تعتمد على ارتفاعه)
        refreshPriority: 1,
        scrub: 0.4,
        onUpdate: (self) => {
          progress = self.progress;
          requestDraw();
          applyStory();
        },
      });
      progress = trigger.progress;
      applyStory();
      requestAnimationFrame(() => ScrollTrigger.refresh());
      console.log(`${LOG} ScrollTrigger created (${device}), start progress=${progress.toFixed(3)}`);
    }

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      document.fonts?.removeEventListener("loadingdone", refit);
      window.removeEventListener("load", refit);
      trigger?.kill();
      loader.onFrameLoad = null;
      loader.pause();
      console.log(`${LOG} cleanup (${device}): ScrollTrigger killed, background loading paused`);
    };
  }, [device, reduced, reducedMotion, lite]);

  return (
    <section
      ref={sectionRef}
      className={`hero-canvas ${reduced ? "hero-canvas--static" : ""}`}
      data-device={device}
    >
      <div className="hero-canvas__stage" ref={stageRef}>
        <canvas ref={canvasRef} className="hero-canvas__canvas" aria-hidden="true" />
        <div className="hero-zone">
          <div className="hero-story">
            {/* العنوان هو H1 الصفحة، ظاهر من أول لحظة */}
            <h1 className="hero-story__title" data-story={0}>
              {heroStory.lines[0]}
            </h1>
            <p className="hero-story__brand">{heroStory.brandLine}</p>
            {/* جملة القصة: فقرة واحدة تُضاف على دفعتين وتبقى */}
            <p className="hero-story__body">
              <span data-story={1}>{heroStory.body[0]}</span>{" "}
              <span data-story={2}>{heroStory.body[1]}</span>
            </p>
            {/* صف الأزرار: واتساب من أول لحظة، «تصفّح البيوت» يُضاف بجانبه عند 78% (مكانه محجوز) */}
            <div className="hero-story__actions">
              <WhatsAppButton label="واتساب" className="hero-story__whatsapp" />
              <Link href={heroStory.cta.href} className="hero-story__browse" data-story={3}>
                {heroStory.cta.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
