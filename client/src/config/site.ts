import type { Lang } from "@/i18n/lang";

/**
 * ============================================================================
 *  ملف البيانات المركزي — Armando Alkadi Holiday Homes
 * ============================================================================
 *  كل البيانات الوهمية (اسم المكتب، الشعار، أرقام التواصل، الروابط، النصوص
 *  الثابتة) معرّفة هنا فقط. لاستبدالها ببيانات العميل الحقيقية لاحقاً، عدّل
 *  هذا الملف وحده — لا حاجة للبحث داخل صفحات الواجهة.
 *
 *  ⚠️ العقارات والخيارات تُدار من لوحة التحكم (/admin) — طبقة البيانات في client/src/lib/catalog/
 *     (تجريبية بالذاكرة حتى ربط Supabase؛ البيانات التجريبية في lib/catalog/demoSeed.ts)
 * ============================================================================
 */

export const brand = {
  /** الاسم الرسمي بالإنجليزي (ملف الهوية AAHH_Brand_Package) */
  name: "Armando Alkadi Holiday Homes",
  /** الاسم الرسمي بالعربي */
  nameAr: "أرماندو القاضي لبيوت العطلات",
  /** الاسم المختصر داخل الجمل العربية */
  shortAr: "أرماندو القاضي",
  /** ملفات الشعار الرسمية (نُظّفت بـ svgo من ملف الهوية، لا تُعدَّل ولا يُعاد رسمها) */
  logo: {
    /** المونوغرام AK بلون Espresso — للأرضية الفاتحة (الهيدر). الحد الأدنى 32px عرضاً */
    monogram: "/brand/aahh/AAHH_Monogram_transparent.svg",
    /** المونوغرام بلون Almond — للأرضية الداكنة (شريط لوحة المكتب) */
    monogramInverse: "/brand/aahh/AAHH_Monogram_Inverse_transparent.svg",
    /** الشعار ثنائي اللغة (العربي أولاً) بألوان فاتحة — للفوتر على Espresso. الحد الأدنى 240px عرضاً */
    bilingualInverse: "/brand/aahh/AAHH_Bilingual_ArabicFirst_Inverse_transparent.svg",
    /** الشعار ثنائي اللغة بألوانه الأصلية الغامقة — لأرضية فاتحة (نهاية الهيرو). الحد الأدنى 240px عرضاً */
    bilingual: "/brand/aahh/AAHH_Bilingual_ArabicFirst_transparent.svg",
  },
} as const;

/**
 * قصة الهيرو: جملة لكل استراحة بين قطع الأثاث، ثم الشعار والزر بعد اكتمال الغرفة.
 * توقيت ظهور كل جملة (حسب الجهاز) في HeroCanvas.tsx → FRAME_SETS.show
 */
export const heroStory = {
  lines: ["كلّ بيتٍ يبدأ فارغًا.", "نختاره بعناية، ونجهّز كل تفاصيله.", "حتى يصبح جاهزًا لك."],
  /** جملة القصة: فقرة واحدة تظهر على دفعتين (20% ثم 41%) على الموبايل واللابتوب */
  body: ["نختاره بعناية، ونجهّز كل تفاصيله،", "حتى يصبح جاهزًا لك."],
  /** سطر الاسم تحت العنوان، ظاهر من أول لحظة */
  brandLine: "أرماندو القاضي لبيوت العطلات، دبي",
  cta: { label: "تصفّح البيوت", href: "/properties" },
} as const;

export const contact = {
  /** رقم الهاتف بصيغة العرض */
  phoneDisplay: "+971 50 246 5851",
  /** نفس الرقم بصيغة الاتصال tel: */
  phoneHref: "+971502465851",
  /** رقم واتساب بالصيغة الدولية بدون + أو مسافات */
  whatsapp: "971502465851",
  address: "مكتب 3126، Aspin Commercial Tower، شارع الشيخ زايد، دبي",
  /**
   * ⚠️ مخفية حتى تصل البيانات الحقيقية من العميل — null يعني لا يظهر الحقل ولا رابطه في أي مكان.
   * عند وصولها: ضع القيمة هنا فقط وستظهر تلقائياً في الفوتر وصفحة التواصل وقائمة الموبايل.
   */
  email: null as string | null,
  hours: null as string | null,
} as const;

/** حسابات التواصل الاجتماعي — فارغة حتى تصل الروابط الحقيقية (لا روابط وهمية) */
export const social: readonly { label: string; href: string }[] = [];

/** رسائل واتساب الجاهزة — تتغير حسب الصفحة (PublicLayout ← whatsappMessage) */
export const whatsappTemplates = {
  general: "مرحباً، أريد الاستفسار عن العقارات المتاحة",
  /** صفحة العقار: الكود والعنوان والرابط */
  property: (title: string, id: string, url: string) => `مرحباً، أريد الاستفسار عن ${title} (${id})\n${url}`,
  viewing: (title: string, id: string) => `مرحباً، أرغب بحجز موعد معاينة لـ ${title} - ${id}`,
  /** صفحة العقارات بعد الفلترة: الفلاتر المختارة */
  filtered: (summary: string) => `مرحباً، أبحث عن عقار: ${summary}`,
  /** بيت مؤجَّر: السؤال عن بيت مشابه متاح */
  similar: (title: string, id: string) => `مرحباً، ${title} (${id}) مؤجر حالياً — هل لديكم بيت مشابه متاح؟`,
  /** المفضلة: كل بيت بالاسم والكود والرابط */
  favorites: (lines: string[]) => `مرحباً، هذه البيوت التي أعجبتني:\n${lines.join("\n")}`,
  /** نموذج صفحة التواصل: يُرسله الزائر بنفسه من واتساب */
  contactForm: (form: { name: string; phone: string; term: string; city: string; message: string }) =>
    [
      "مرحباً، أريد المساعدة في إيجاد عقار.",
      `الاسم: ${form.name}`,
      `الهاتف: ${form.phone}`,
      form.term && `نوع الإيجار: ${form.term}`,
      form.city && `المنطقة: ${form.city}`,
      form.message && `التفاصيل: ${form.message}`,
    ]
      .filter(Boolean)
      .join("\n"),
} as const;

/**
 * النسخة الإنجليزية: false = لا يظهر مبدّل اللغة إطلاقاً (لا خيار «قريباً» يوصل لحيط).
 * عند جاهزيتها: true فقط ويعود المبدّل في الهيدر وقائمة الموبايل.
 */
export const englishReady = true;

/** رابط واتساب برسالة جاهزة */
export const whatsappHref = (message: string = whatsappTemplates.general) =>
  `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;

/** روابط التنقل في الهيدر والفوتر */
export const mainNav = [
  { label: "الرئيسية", href: "/" },
  { label: "العقارات", href: "/properties" },
  { label: "تواصل معنا", href: "/contact" },
] as const;

/** عناوين ووصف الصفحات — تُحقن في <title> و<meta name="description"> */
export const pageMeta = {
  home: {
    title: "أرماندو القاضي لبيوت العطلات — منازل مختارة للإيجار الشهري والسنوي في دبي",
    description:
      "أرماندو القاضي لبيوت العطلات (Armando Alkadi Holiday Homes): شقق وفلل واستوديوهات مختارة للإيجار الشهري والسنوي في دبي.",
  },
  properties: {
    title: "العقارات المتاحة — أرماندو القاضي لبيوت العطلات",
    description:
      "تصفح جميع عقارات أرماندو القاضي المتاحة للإيجار الشهري والسنوي، مع فلترة حسب السعر والمنطقة ونوع العقار.",
  },
  contact: {
    title: "تواصل معنا — أرماندو القاضي لبيوت العطلات",
    description:
      "تحدث مع أحد مستشاري أرماندو القاضي لمساعدتك في العثور على العقار المناسب للإيجار في دبي.",
  },
  admin: {
    title: "لوحة المكتب — أرماندو القاضي لبيوت العطلات",
    description: "لوحة إدارة عقارات واستفسارات مكتب أرماندو القاضي لبيوت العطلات.",
  },
  notFound: {
    title: "الصفحة غير موجودة — أرماندو القاضي لبيوت العطلات",
    description: "الصفحة المطلوبة غير متوفرة.",
  },
} as const;

/**
 * الأرشفة بمحركات البحث: false = كل الصفحات noindex (الوضع الحالي حتى الإطلاق).
 * عند الإطلاق: true هنا + حذف سطر X-Robots-Tag من client/public/_headers + حذف meta robots من client/index.html.
 */
export const indexing = false;

/** يظهر أعلى الموقع للتوضيح أن هذه نسخة عرض */
export const demoNotice = {
  enabled: true,
  text: "نسخة عرض تفاعلية — البيانات المعروضة تجريبية ولا تُحفظ",
} as const;

// ============================================================================
//  النسخة الإنجليزية (/en) — نفس البنية. نصوص القصة والتسويق مسودة تنتظر موافقة صاحب المكتب.
// ============================================================================
const heroStoryEn = {
  lines: ["Every home starts empty.", "We choose it with care and prepare every detail.", "Until it is ready for you."],
  body: ["We choose it with care and prepare every detail,", "until it is ready for you."],
  brandLine: "Armando Alkadi Holiday Homes, Dubai",
  cta: { label: "Browse homes", href: "/properties" },
} as const;

const pageMetaEn = {
  home: {
    title: "Armando Alkadi Holiday Homes — Selected homes for monthly and yearly rent in Dubai",
    description: "Armando Alkadi Holiday Homes: selected apartments, villas and studios for monthly and yearly rent in Dubai.",
  },
  properties: {
    title: "Available homes — Armando Alkadi Holiday Homes",
    description: "Browse all Armando Alkadi homes available for monthly and yearly rent, with filters for price, area and property type.",
  },
  contact: {
    title: "Contact us — Armando Alkadi Holiday Homes",
    description: "Talk to an Armando Alkadi advisor to help you find the right home to rent in Dubai.",
  },
  admin: pageMeta.admin,
  notFound: {
    title: "Page not found — Armando Alkadi Holiday Homes",
    description: "The page you requested is not available.",
  },
} as const;

const whatsappTemplatesEn = {
  general: "Hello, I would like to ask about your available homes",
  property: (title: string, id: string, url: string) => `Hello, I would like to ask about ${title} (${id})\n${url}`,
  viewing: (title: string, id: string) => `Hello, I would like to book a viewing for ${title} - ${id}`,
  filtered: (summary: string) => `Hello, I am looking for a home: ${summary}`,
  similar: (title: string, id: string) => `Hello, ${title} (${id}) is currently rented — do you have a similar home available?`,
  favorites: (lines: string[]) => `Hello, these are the homes I liked:\n${lines.join("\n")}`,
  contactForm: (form: { name: string; phone: string; term: string; city: string; message: string }) =>
    [
      "Hello, I would like help finding a home.",
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      form.term && `Rental type: ${form.term}`,
      form.city && `Area: ${form.city}`,
      form.message && `Details: ${form.message}`,
    ]
      .filter(Boolean)
      .join("\n"),
} as const;

const mainNavEn = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/properties" },
  { label: "Contact us", href: "/contact" },
] as const;

export const heroStoryFor = (lang: Lang) => (lang === "en" ? heroStoryEn : heroStory);
export const pageMetaFor = (lang: Lang) => (lang === "en" ? pageMetaEn : pageMeta);
export const whatsappTemplatesFor = (lang: Lang) => (lang === "en" ? whatsappTemplatesEn : whatsappTemplates);
export const mainNavFor = (lang: Lang) => (lang === "en" ? mainNavEn : mainNav);
