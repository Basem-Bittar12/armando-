/**
 * البيانات التجريبية بنفس شكل جداول Supabase — تُستعمل حين لا يكون Supabase مربوطاً (التطوير والاختبارات).
 * نفس الخيارات المبدئية في supabase/migrations/0003_options_seed.sql ونفس عقارات دبي الثلاثة (is_demo).
 */
import { contact, social } from "@/config/site";
import type { CatalogData, FullProperty, ImageRow } from "./types";

const unsplash = (photo: string) => (width: number) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${width}&q=85`;

const image = (id: string, sort: number, photo: string): ImageRow => {
  const at = unsplash(photo);
  return { id, sort_order: sort, src_640: at(640), src_1080: at(1080), src_1600: at(1600) };
};

const INTERIOR_A = "photo-1600566753086-00f18fb6b3ea";
const INTERIOR_B = "photo-1600585154526-990dced4db0d";
const INTERIOR_C = "photo-1616486338812-3dadae4b4ace";

const base = {
  max_guests: null,
  map_url: null,
  permit_no: null,
  available_from: null,
  is_published: true,
  is_demo: true,
  updated_at: "2026-10-07T00:00:00Z",
} as const;

const properties: FullProperty[] = [
  {
    ...base,
    id: "p-102",
    code: "AK-102",
    title: "شقة بانورامية بإطلالة على المدينة",
    description:
      "شقة بانورامية في قلب وسط مدينة دبي، بإطلالة مفتوحة على أفق المدينة. مساحات معيشة واسعة، نوافذ ممتدة من الأرض حتى السقف، وتشطيبات معاصرة بألوان هادئة. على بعد دقائق من دبي مول ومحطة المترو.",
    city_id: "city-dubai",
    area_id: "area-downtown",
    type_id: "type-apartment",
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1420,
    floor: "24",
    year_built: 2021,
    furnished: true,
    min_rent_period: "3 أشهر",
    status: "متاح",
    is_new: true,
    show_on_home: true,
    home_order: 1,
    prices: [{ rental_term_id: "term-monthly", amount: 8500 }],
    amenity_ids: ["am-parking", "am-shared-pool", "am-gym", "am-security", "am-balcony"],
    images: [
      image("img-102-0", 0, "photo-1600607687920-4e2a09cf159d"),
      image("img-102-1", 1, INTERIOR_A),
      image("img-102-2", 2, INTERIOR_B),
      image("img-102-3", 3, INTERIOR_C),
    ],
  },
  {
    ...base,
    id: "p-087",
    code: "AK-087",
    title: "فيلا خاصة بتصميم معاصر",
    description:
      "فيلا مستقلة بتصميم معاصر في البرشاء، تتوزع على طابقين مع حديقة خاصة ومسبح. مساحات استقبال منفصلة، مطبخ مجهز، وغرفة خادمة. مناسبة للعائلات الباحثة عن الخصوصية مع قرب المدارس والمراكز التجارية.",
    city_id: "city-dubai",
    area_id: "area-barsha",
    type_id: "type-villa",
    bedrooms: 4,
    bathrooms: 5,
    area_sqft: 3800,
    floor: null,
    year_built: 2019,
    furnished: false,
    min_rent_period: "سنة واحدة",
    status: "متاح",
    is_new: false,
    show_on_home: true,
    home_order: 2,
    prices: [{ rental_term_id: "term-yearly", amount: 185000 }],
    amenity_ids: ["am-garden", "am-private-pool", "am-parking", "am-maid", "am-gated", "am-security"],
    images: [
      image("img-087-0", 0, "photo-1600585154340-be6161a56a0c"),
      image("img-087-1", 1, INTERIOR_B),
      image("img-087-2", 2, INTERIOR_C),
      image("img-087-3", 3, INTERIOR_A),
    ],
  },
  {
    ...base,
    id: "p-095",
    code: "AK-095",
    title: "استوديو أنيق مفروش بالكامل",
    description:
      "استوديو مفروش بالكامل في الخليج التجاري، جاهز للسكن الفوري. تصميم ذكي يستثمر كامل المساحة، مع مطبخ مدمج وإطلالة على القناة المائية.",
    city_id: "city-dubai",
    area_id: "area-business-bay",
    type_id: "type-studio",
    bedrooms: 0,
    bathrooms: 1,
    area_sqft: 510,
    floor: "12",
    year_built: 2023,
    furnished: true,
    min_rent_period: "شهر واحد",
    status: "متاح",
    is_new: false,
    show_on_home: true,
    home_order: 3,
    prices: [{ rental_term_id: "term-monthly", amount: 4900 }],
    amenity_ids: ["am-gym", "am-shared-pool", "am-parking"],
    images: [
      image("img-095-0", 0, "photo-1618221195710-dd6b41faaea6"),
      image("img-095-1", 1, INTERIOR_B),
      image("img-095-2", 2, INTERIOR_A),
      image("img-095-3", 3, INTERIOR_C),
    ],
  },
];

const option = (id: string, name_ar: string, name_en: string, sort_order: number) => ({
  id,
  name_ar,
  name_en,
  sort_order,
  is_active: true,
});

export function demoCatalog(): CatalogData {
  return structuredClone({
    cities: [option("city-dubai", "دبي", "Dubai", 1)],
    areas: [
      { ...option("area-downtown", "وسط مدينة دبي", "Downtown Dubai", 1), city_id: "city-dubai", cover_url: unsplash("photo-1512453979798-5ea266f8880c")(1080) },
      { ...option("area-barsha", "البرشاء", "Al Barsha", 2), city_id: "city-dubai", cover_url: unsplash("photo-1518684079-3c830dcef090")(1080) },
      { ...option("area-business-bay", "الخليج التجاري", "Business Bay", 3), city_id: "city-dubai", cover_url: unsplash("photo-1534274988757-a28bf1a57c17")(1080) },
    ],
    property_types: [
      option("type-apartment", "شقة", "Apartment", 1),
      option("type-villa", "فيلا", "Villa", 2),
      option("type-studio", "استوديو", "Studio", 3),
      option("type-townhouse", "تاون هاوس", "Townhouse", 4),
    ],
    rental_terms: [
      { ...option("term-monthly", "شهري", "Monthly", 1), unit_ar: "درهم / شهري", unit_en: "AED / month" },
      { ...option("term-yearly", "سنوي", "Yearly", 2), unit_ar: "درهم / سنوي", unit_en: "AED / year" },
    ],
    amenities: [
      option("am-parking", "موقف سيارة", "Parking", 1),
      option("am-shared-pool", "مسبح مشترك", "Shared pool", 2),
      option("am-private-pool", "مسبح خاص", "Private pool", 3),
      option("am-garden", "حديقة خاصة", "Private garden", 4),
      option("am-gym", "صالة رياضية", "Gym", 5),
      option("am-security", "أمن 24 ساعة", "24h security", 6),
      option("am-balcony", "شرفة", "Balcony", 7),
      option("am-maid", "غرفة خادمة", "Maid's room", 8),
      option("am-metro", "قريب من المترو", "Near metro", 9),
      option("am-sea", "إطلالة بحرية", "Sea view", 10),
      option("am-gated", "مجمع مغلق", "Gated community", 11),
    ],
    properties,
    settings: {
      home_count: 6,
      phone: contact.phoneDisplay,
      whatsapp: contact.whatsapp,
      email: contact.email,
      address: contact.address,
      hours: contact.hours,
      social: [...social],
    },
  });
}
