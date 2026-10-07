/**
 * أنواع بيانات الكتالوج — بنفس شكل جداول Supabase (supabase/migrations/0001_schema.sql)
 * حتى يكون استبدال المصدر المحلي (التجريبي) بـ Supabase تبديلاً للمصدر فقط، لا للصفحات.
 */

export type OptionKind = "cities" | "areas" | "property_types" | "rental_terms" | "amenities";

export type OptionRow = {
  id: string;
  name_ar: string;
  name_en: string;
  sort_order: number;
  is_active: boolean;
};
export type CityRow = OptionRow;
export type AreaRow = OptionRow & { city_id: string; cover_url: string | null };
export type PropertyTypeRow = OptionRow;
export type RentalTermRow = OptionRow & { unit_ar: string; unit_en: string };
export type AmenityRow = OptionRow;

export type PropertyStatus = "متاح" | "محجوز" | "مؤجر";
export const PROPERTY_STATUSES: PropertyStatus[] = ["متاح", "محجوز", "مؤجر"];

/** صورة عقار: ثلاث نسخ WebP (أو روابط جاهزة في البيانات التجريبية) */
export type ImageRow = {
  id: string;
  sort_order: number;
  src_640: string;
  src_1080: string;
  src_1600: string;
};

export type PriceRow = { rental_term_id: string; amount: number };

export type PropertyRow = {
  id: string;
  code: string;
  title: string;
  description: string;
  city_id: string;
  area_id: string | null;
  type_id: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number | null;
  floor: string | null;
  year_built: number | null;
  furnished: boolean;
  min_rent_period: string | null;
  max_guests: number | null;
  map_url: string | null;
  permit_no: string | null;
  available_from: string | null;
  status: PropertyStatus;
  is_new: boolean;
  is_published: boolean;
  show_on_home: boolean;
  home_order: number;
  is_demo: boolean;
  updated_at: string;
};

/** العقار كاملاً مع أسعاره وصوره ومرافقه */
export type FullProperty = PropertyRow & {
  prices: PriceRow[];
  images: ImageRow[];
  amenity_ids: string[];
};

export type Settings = { home_count: number };

export type CatalogData = {
  cities: CityRow[];
  areas: AreaRow[];
  property_types: PropertyTypeRow[];
  rental_terms: RentalTermRow[];
  amenities: AmenityRow[];
  properties: FullProperty[];
  settings: Settings;
};

/** صورة جديدة من لوحة التحكم قبل الرفع: النسخ الثلاث مصغّرة بالمتصفح */
export type NewImage = {
  id: string;
  blobs: { 640: Blob; 1080: Blob; 1600: Blob };
  /** معاينة محلية */
  preview: string;
};

/** صورة داخل فورم العقار: إما محفوظة (ImageRow) أو جديدة لم تُرفع بعد */
export type DraftImage = { kind: "saved"; image: ImageRow } | { kind: "new"; image: NewImage };

/** ما يرسله فورم العقار للحفظ */
export type PropertyInput = Omit<PropertyRow, "id" | "updated_at" | "home_order" | "is_demo"> & {
  id?: string;
  prices: PriceRow[];
  amenity_ids: string[];
  images: DraftImage[];
};

/** أخطاء مفهومة لصاحب الموقع */
export class CatalogError extends Error {
  constructor(
    public code: "home_limit" | "code_taken" | "in_use" | "storage" | "network" | "invalid",
    message: string,
  ) {
    super(message);
  }
}
