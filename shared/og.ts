/**
 * معاينة رابط العقار عند مشاركته (واتساب، سوشيال): وسوم Open Graph من بيانات العقار.
 * مشترك بين Netlify Edge Function (Deno) والاختبارات — بلا أي مكتبة، fetch فقط.
 */

export type OgProperty = {
  code: string;
  title: string;
  description: string;
  location: string;
  /** «8,500 درهم / شهري» أو null بدون سعر */
  price: string | null;
  image: string | null;
  lang: OgLang;
};

/** لغة الرابط: /en/property/… إنجليزي، وغيره عربي */
export type OgLang = "ar" | "en";

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SITE_NAME: Record<OgLang, string> = { ar: "أرماندو القاضي لبيوت العطلات", en: "Armando Alkadi Holiday Homes" };

/** الإنجليزي إن وُجد، وإلا العربي (نفس قاعدة الموقع) */
const pick = (lang: OgLang, ar: string | undefined, en: string | null | undefined) => (lang === "en" && en?.trim() ? en.trim() : ar ?? "");

/** يجلب العقار المنشور بالكود عبر REST العام (المفتاح العام + RLS: المنشور فقط) */
export async function fetchOgProperty(supabaseUrl: string, anonKey: string, code: string, lang: OgLang = "ar"): Promise<OgProperty | null> {
  if (!/^[A-Za-z0-9-]{2,20}$/.test(code)) return null;
  const base = supabaseUrl.replace(/\/$/, "");
  const select =
    "code,title,title_en,description,description_en,cities(name_ar,name_en),areas(name_ar,name_en),property_prices(amount,rental_terms(unit_ar,unit_en,sort_order)),property_images(path_1080,sort_order)";
  const response = await fetch(
    `${base}/rest/v1/properties?select=${encodeURIComponent(select)}&code=eq.${encodeURIComponent(code.toUpperCase())}&is_published=eq.true&limit=1`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: "application/json" } },
  );
  if (!response.ok) return null;
  const rows = (await response.json()) as {
    code: string;
    title: string;
    title_en: string | null;
    description: string;
    description_en: string | null;
    cities: { name_ar: string; name_en: string } | null;
    areas: { name_ar: string; name_en: string } | null;
    property_prices: { amount: number; rental_terms: { unit_ar: string; unit_en: string; sort_order: number } | null }[];
    property_images: { path_1080: string; sort_order: number }[];
  }[];
  const row = rows[0];
  if (!row) return null;
  const price = [...row.property_prices].sort((a, b) => (a.rental_terms?.sort_order ?? 0) - (b.rental_terms?.sort_order ?? 0))[0];
  const cover = [...row.property_images].sort((a, b) => a.sort_order - b.sort_order)[0];
  // صورة المشاركة JPEG إن وُجدت (واتساب)، وإلا نسخة WebP 1080
  let image: string | null = null;
  if (cover) {
    const webp = `${base}/storage/v1/object/public/property-images/${cover.path_1080}`;
    const jpeg = webp.replace(/-1080\.webp$/, "-og.jpg");
    const head = await fetch(jpeg, { method: "HEAD" }).catch(() => null);
    image = head?.ok ? jpeg : webp;
  }
  return {
    code: row.code,
    title: pick(lang, row.title, row.title_en),
    description: pick(lang, row.description, row.description_en),
    location: [pick(lang, row.areas?.name_ar, row.areas?.name_en), pick(lang, row.cities?.name_ar, row.cities?.name_en)]
      .filter(Boolean)
      .join(lang === "en" ? ", " : "، "),
    price: price
      ? `${new Intl.NumberFormat("en-US").format(Number(price.amount))} ${price.rental_terms ? pick(lang, price.rental_terms.unit_ar, price.rental_terms.unit_en) : lang === "en" ? "AED" : "درهم"}`
      : null,
    image,
    lang,
  };
}

/** وسوم المعاينة: العنوان + السعر + الموقع + صورة الغلاف */
export function buildOgTags(property: OgProperty, pageUrl: string): { title: string; tags: string } {
  const siteName = SITE_NAME[property.lang];
  const title = `${property.title} — ${property.code} | ${siteName}`;
  const summary = [property.price, property.location].filter(Boolean).join(" · ");
  const description = [summary, property.description.replace(/\s+/g, " ").slice(0, 160)].filter(Boolean).join(" — ");
  const meta = (attr: "property" | "name", key: string, content: string) => `<meta ${attr}="${key}" content="${escape(content)}" />`;
  const tags = [
    meta("name", "description", description),
    meta("property", "og:type", "website"),
    meta("property", "og:site_name", siteName),
    meta("property", "og:locale", property.lang === "en" ? "en_AE" : "ar_AE"),
    meta("property", "og:url", pageUrl),
    meta("property", "og:title", `${property.title}${property.price ? ` · ${property.price}` : ""}`),
    meta("property", "og:description", description),
    ...(property.image
      ? [meta("property", "og:image", property.image), meta("name", "twitter:image", property.image)]
      : []),
    meta("name", "twitter:card", property.image ? "summary_large_image" : "summary"),
    meta("name", "twitter:title", property.title),
    meta("name", "twitter:description", description),
  ].join("\n    ");
  return { title, tags };
}

/** يستبدل <title> ووصف الصفحة الافتراضي ويضيف الوسوم قبل </head> */
export function injectOg(html: string, og: { title: string; tags: string }, lang: OgLang = "ar"): string {
  return html
    .replace('<html lang="ar" dir="rtl">', lang === "en" ? '<html lang="en" dir="ltr">' : '<html lang="ar" dir="rtl">')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(og.title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>\s*/, "")
    .replace("</head>", `    ${og.tags}\n  </head>`);
}
