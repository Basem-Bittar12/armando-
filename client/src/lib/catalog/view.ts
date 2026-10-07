/**
 * تحويل بيانات الكتالوج (شكل الجداول) إلى ما تعرضه صفحات الموقع العام — نفس شكل العقار الذي كانت
 * الصفحات تستعمله، فلا يتغير شيء بالتصميم.
 */
import { bySort } from "./store";
import type { CatalogData, FullProperty, PropertyStatus } from "./types";

export type { PropertyStatus } from "./types";

/** العقار كما تعرضه الصفحات العامة (id = الكود الظاهر، مثل AK-102) */
export type Property = {
  id: string;
  uid: string;
  title: string;
  location: string;
  city: string;
  areaName: string | null;
  /** أول سعر (حسب ترتيب أنواع الإيجار) — هو ما يعرضه الكرت */
  price: string;
  priceValue: number;
  term: string;
  unit: string;
  /** كل أسعار العقار (شهري وسنوي معاً ممكن) */
  prices: { term: string; amount: number; unit: string }[];
  type: string;
  beds: number;
  baths: number;
  area: string;
  areaValue: number;
  image: string;
  gallery: string[];
  status: PropertyStatus;
  description: string;
  amenities: string[];
  details: { label: string; value: string }[];
  featured: boolean;
  new: boolean;
  availableFrom: string | null;
  mapUrl: string | null;
};

const number = new Intl.NumberFormat("en-US");

export function toPublic(p: FullProperty, data: CatalogData): Property {
  const city = data.cities.find((c) => c.id === p.city_id)?.name_ar ?? "";
  const area = p.area_id ? data.areas.find((a) => a.id === p.area_id)?.name_ar ?? null : null;
  const type = data.property_types.find((t) => t.id === p.type_id)?.name_ar ?? "";
  const terms = bySort(data.rental_terms);
  // أول سعر حسب ترتيب أنواع الإيجار
  const sortedPrices = [...p.prices].sort(
    (a, b) => terms.findIndex((t) => t.id === a.rental_term_id) - terms.findIndex((t) => t.id === b.rental_term_id),
  );
  const firstPrice = sortedPrices[0];
  const term = firstPrice ? terms.find((t) => t.id === firstPrice.rental_term_id) : undefined;
  const gallery = bySort(p.images).map((image) => image.src_1080);
  const details: { label: string; value: string }[] = [];
  if (p.floor) details.push({ label: "الطابق", value: /^\d+$/.test(p.floor) ? `الطابق ${p.floor}` : p.floor });
  if (p.year_built) details.push({ label: "سنة البناء", value: String(p.year_built) });
  if (p.min_rent_period) details.push({ label: "الحد الأدنى للإيجار", value: p.min_rent_period });
  details.push({ label: "التأثيث", value: p.furnished ? "مفروش بالكامل" : "غير مفروش" });
  if (p.max_guests) details.push({ label: "أقصى عدد ضيوف", value: String(p.max_guests) });
  if (p.permit_no) details.push({ label: "رقم التصريح", value: p.permit_no });

  return {
    id: p.code,
    uid: p.id,
    title: p.title,
    location: [area, city].filter(Boolean).join("، "),
    city,
    areaName: area,
    price: firstPrice ? number.format(firstPrice.amount) : "—",
    priceValue: firstPrice?.amount ?? 0,
    term: term?.name_ar ?? "",
    unit: term?.unit_ar ?? "درهم",
    prices: sortedPrices.map((price) => {
      const t = terms.find((item) => item.id === price.rental_term_id);
      return { term: t?.name_ar ?? "", amount: price.amount, unit: t?.unit_ar ?? "درهم" };
    }),
    type,
    beds: p.bedrooms,
    baths: p.bathrooms,
    area: p.area_sqft ? `${number.format(p.area_sqft)} قدم²` : "",
    areaValue: p.area_sqft ?? 0,
    image: gallery[0] ?? "",
    gallery,
    status: p.status,
    description: p.description,
    amenities: bySort(data.amenities.filter((a) => p.amenity_ids.includes(a.id))).map((a) => a.name_ar),
    details,
    featured: p.show_on_home,
    new: p.is_new,
    availableFrom: p.available_from,
    mapUrl: p.map_url,
  };
}

/** كل العقارات المنشورة بشكل العرض */
export const publishedProperties = (data: CatalogData) =>
  data.properties.filter((p) => p.is_published).map((p) => toPublic(p, data));

/** شريط الرئيسية: منشور + معروض بالرئيسية + غير مؤجّر، بترتيبه، وبحد العدد من الإعدادات */
export const homeProperties = (data: CatalogData) =>
  data.properties
    .filter((p) => p.is_published && p.show_on_home && p.status !== "مؤجر")
    .sort((a, b) => a.home_order - b.home_order)
    .slice(0, data.settings.home_count)
    .map((p) => toPublic(p, data));

/**
 * خيارات الفلاتر: فقط المفعّل الذي عليه عقار منشور واحد على الأقل. عدد الغرف من البيانات نفسها.
 */
export function filterOptions(data: CatalogData) {
  const published = data.properties.filter((p) => p.is_published);
  const used = (ids: (string | null)[]) => new Set(ids.filter(Boolean) as string[]);
  const cityIds = used(published.map((p) => p.city_id));
  const typeIds = used(published.map((p) => p.type_id));
  const termIds = used(published.flatMap((p) => p.prices.map((price) => price.rental_term_id)));
  const beds = Array.from(new Set(published.map((p) => p.bedrooms))).sort((a, b) => a - b);
  return {
    cities: bySort(data.cities.filter((c) => c.is_active && cityIds.has(c.id))).map((c) => c.name_ar),
    types: bySort(data.property_types.filter((t) => t.is_active && typeIds.has(t.id))).map((t) => t.name_ar),
    terms: bySort(data.rental_terms.filter((t) => t.is_active && termIds.has(t.id))).map((t) => t.name_ar),
    beds,
  };
}

/** قسم «اكتشف المكان»: المناطق المفعّلة التي فيها عقار منشور، بعددها الحقيقي وصورة الغلاف */
export function areaCards(data: CatalogData) {
  const published = data.properties.filter((p) => p.is_published);
  return bySort(data.areas.filter((a) => a.is_active))
    .map((area) => {
      const here = published.filter((p) => p.area_id === area.id);
      const cover = area.cover_url ?? (here[0] ? bySort(here[0].images)[0]?.src_1080 ?? null : null);
      return { id: area.id, name: area.name_ar, count: here.length, cover };
    })
    .filter((card) => card.count > 0);
}
