import type { Property } from "@/lib/catalog/view";

/**
 * منطق البحث والفلترة. كل الفلاتر تُخزَّن في رابط الصفحة (query string)
 * حتى يمكن مشاركة نتيجة بحث معيّنة كرابط مباشر.
 */

/** مفتاح آخر بحث في العقارات (sessionStorage) — يقرؤه رابط «العودة إلى العقارات» في صفحة البيت */
export const LAST_LISTING_KEY = "aahh:last-listing";

/** آخر صفحة عقارات زارها الزائر (بفلاترها)، أو كل العقارات */
export function lastListingHref(): string {
  try {
    const href = sessionStorage.getItem(LAST_LISTING_KEY);
    return href && href.startsWith("/properties") ? href : "/properties";
  } catch {
    return "/properties";
  }
}

export type SortKey = "newest" | "priceAsc" | "priceDesc" | "areaDesc";

export type Filters = {
  q: string;
  term: string;
  type: string;
  city: string;
  /** "0" استوديو، "4" تعني 4 غرف فأكثر */
  beds: string;
  minPrice: string;
  maxPrice: string;
  sort: SortKey;
  /** عرض المفضلة فقط */
  fav: boolean;
};

export const emptyFilters: Filters = {
  q: "",
  term: "",
  type: "",
  city: "",
  beds: "",
  minPrice: "",
  maxPrice: "",
  sort: "newest",
  fav: false,
};

export const sortLabels: Record<SortKey, string> = {
  newest: "الأحدث أولاً",
  priceAsc: "السعر: من الأقل",
  priceDesc: "السعر: من الأعلى",
  areaDesc: "الأكبر مساحة",
};

export function filtersFromParams(params: URLSearchParams): Filters {
  const sort = params.get("sort") as SortKey | null;
  return {
    q: params.get("q") ?? "",
    term: params.get("term") ?? "",
    type: params.get("type") ?? "",
    city: params.get("city") ?? "",
    beds: params.get("beds") ?? "",
    minPrice: params.get("min") ?? "",
    maxPrice: params.get("max") ?? "",
    sort: sort && sort in sortLabels ? sort : "newest",
    fav: params.get("fav") === "1",
  };
}

export function filtersToParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.term) params.set("term", filters.term);
  if (filters.type) params.set("type", filters.type);
  if (filters.city) params.set("city", filters.city);
  if (filters.beds) params.set("beds", filters.beds);
  if (filters.minPrice) params.set("min", filters.minPrice);
  if (filters.maxPrice) params.set("max", filters.maxPrice);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.fav) params.set("fav", "1");
  return params;
}

/** عدد الفلاتر النشطة — يظهر كرقم بجانب زر «الفلاتر» */
export function activeFilterCount(filters: Filters): number {
  let count = 0;
  if (filters.q) count += 1;
  if (filters.term) count += 1;
  if (filters.type) count += 1;
  if (filters.city) count += 1;
  if (filters.beds) count += 1;
  if (priceFilterActive(filters)) count += 1;
  if (filters.fav) count += 1;
  return count;
}

const termOrder = (term: string) => (term === "شهري" ? 0 : 1);

/** هل فلتر السعر مستعمل */
export const priceFilterActive = (filters: Filters) => Boolean(filters.minPrice || filters.maxPrice);

export function applyFilters(
  list: Property[],
  filters: Filters,
  favorites: string[] = [],
): Property[] {
  const query = filters.q.trim().toLowerCase();
  // فلتر السعر يعمل دائماً على السعر المعروض (شهري أو سنوي حسب العقار)، بلا حاجة لاختيار نوع الإيجار
  const min = Number(filters.minPrice) || 0;
  const max = Number(filters.maxPrice) || Number.POSITIVE_INFINITY;
  const beds = filters.beds === "" ? null : Number(filters.beds);

  const filtered = list.filter((property) => {
    if (filters.fav && !favorites.includes(property.id)) return false;
    // العقار قد يكون له سعر شهري وسنوي معاً: يطابق أي منهما
    if (filters.term && !property.prices.some((price) => price.term === filters.term)) return false;
    if (filters.type && property.type !== filters.type) return false;
    if (filters.city && property.city !== filters.city) return false;
    if (beds !== null) {
      // "4" تعني 4 غرف فأكثر
      if (beds >= 4 ? property.beds < 4 : property.beds !== beds) return false;
    }
    // السعر المقارَن: سعر نوع الإيجار المختار إن وُجد، وإلا السعر المعروض
    const price = (filters.term && property.prices.find((p) => p.term === filters.term)?.amount) || property.priceValue;
    if (price < min || price > max) return false;
    if (query) {
      const haystack = `${property.title} ${property.location} ${property.city} ${property.id} ${property.type}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  // الترتيب بالسعر: الشهري معاً ثم السنوي معاً، وكل مجموعة مرتبة بسعرها
  const byTerm = (a: Property, b: Property) => termOrder(a.term) - termOrder(b.term);
  switch (filters.sort) {
    case "priceAsc":
      sorted.sort((a, b) => byTerm(a, b) || a.priceValue - b.priceValue);
      break;
    case "priceDesc":
      sorted.sort((a, b) => byTerm(a, b) || b.priceValue - a.priceValue);
      break;
    case "areaDesc":
      sorted.sort((a, b) => b.areaValue - a.areaValue);
      break;
    default:
      // الأحدث أولاً: العقارات المعلّمة "جديد" تتقدم، مع الحفاظ على الترتيب الأصلي
      sorted.sort((a, b) => Number(Boolean(b.new)) - Number(Boolean(a.new)));
  }
  return sorted;
}

/** عقارات مشابهة لصفحة تفاصيل العقار */
export function similarProperties(list: Property[], current: Property, limit = 3): Property[] {
  const scored = list
    .filter((property) => property.id !== current.id)
    .map((property) => {
      let score = 0;
      if (property.city === current.city) score += 3;
      if (property.term === current.term) score += 2;
      if (property.type === current.type) score += 2;
      if (Math.abs(property.beds - current.beds) <= 1) score += 1;
      if (property.status === "متاح") score += 1;
      return { property, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.property);
}
