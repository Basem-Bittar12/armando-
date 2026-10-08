/**
 * أدوات مشتركة لمصدر Supabase: تحويل الأخطاء لرسائل مفهومة، وتحويل الصفوف لشكل الكتالوج.
 */
import { AREA_COVERS_BUCKET, IMAGES_BUCKET, publicUrl } from "@/lib/supabase";
import { CatalogError, type AreaRow, type ImageRow, type OptionKind } from "./types";

export type DbError = { message: string; code?: string; details?: string | null; hint?: string | null } | null;

/** خطأ Supabase → رسالة يفهمها صاحب الموقع */
export function toCatalogError(error: DbError | Error, fallback = "صار خطأ بالحفظ — جرّب مرة ثانية"): CatalogError {
  if (error instanceof CatalogError) return error;
  const message = error?.message ?? "";
  const code = (error as { code?: string } | null)?.code;
  if (/home_limit_reached/.test(message)) return new CatalogError("home_limit", "وصلت لحد عقارات الرئيسية. شيل عقاراً منها أو كبّر العدد من صفحة «الرئيسية».");
  if (code === "23505" && /code/.test(message)) return new CatalogError("code_taken", "هذا الكود مستعمل لعقار آخر");
  if (code === "23503") return new CatalogError("in_use", "هذا الخيار مستعمل بعقار — أوقفه بدل الحذف");
  if (/area_city_mismatch/.test(message)) return new CatalogError("invalid", "المنطقة ليست تابعة لمدينة العقار");
  if (code === "42501" || /not_admin|row-level security/.test(message)) return new CatalogError("invalid", "ما عندك صلاحية — سجّل دخول من جديد");
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) return new CatalogError("network", "ما في اتصال بالإنترنت — جرّب مرة ثانية");
  console.error("[Catalog]", error);
  return new CatalogError("invalid", fallback);
}

export async function must<T>(query: PromiseLike<{ data: T; error: DbError }>): Promise<T> {
  const { data, error } = await query;
  if (error) throw toCatalogError(error);
  return data;
}

export const OPTION_COLUMNS: Record<OptionKind, string[]> = {
  cities: ["id", "name_ar", "name_en", "sort_order", "is_active"],
  areas: ["id", "city_id", "name_ar", "name_en", "cover_path", "sort_order", "is_active"],
  property_types: ["id", "name_ar", "name_en", "sort_order", "is_active"],
  rental_terms: ["id", "name_ar", "name_en", "unit_ar", "unit_en", "sort_order", "is_active"],
  amenities: ["id", "name_ar", "name_en", "sort_order", "is_active"],
};

export const PROPERTY_COLUMNS = [
  "id", "code", "title", "description", "city_id", "area_id", "type_id", "bedrooms", "bathrooms", "area_sqft", "floor",
  "year_built", "furnished", "min_rent_period", "max_guests", "map_url", "permit_no", "available_from", "status",
  "is_new", "is_published", "show_on_home", "home_order", "is_demo", "updated_at",
] as const;
/** حقول تقبلها التعديلات السريعة من القائمة */
export const PATCHABLE = new Set(["is_published", "status", "show_on_home", "home_order", "is_new"]);

export const pick = (row: Record<string, unknown>, keys: readonly string[]) =>
  Object.fromEntries(keys.filter((key) => key in row).map((key) => [key, row[key]]));

export type DbImage = { id: string; sort_order: number; path_640: string; path_1080: string; path_1600: string; width: number | null; height: number | null };

export const imageFromDb = (row: DbImage): ImageRow => ({
  id: row.id,
  sort_order: row.sort_order,
  src_640: publicUrl(IMAGES_BUCKET, row.path_640),
  src_1080: publicUrl(IMAGES_BUCKET, row.path_1080),
  src_1600: publicUrl(IMAGES_BUCKET, row.path_1600),
  paths: { 640: row.path_640, 1080: row.path_1080, 1600: row.path_1600 },
  width: row.width,
  height: row.height,
});

export const areaFromDb = (row: Omit<AreaRow, "cover_url">): AreaRow => ({
  ...row,
  cover_url: row.cover_path ? publicUrl(AREA_COVERS_BUCKET, row.cover_path) : null,
});

/** كل ملفات الصورة: النسخ الثلاث + صورة المشاركة JPEG (إن وُجدت؛ حذف ملف غير موجود لا يضر) */
export const imagePaths = (image: ImageRow) =>
  image.paths ? [image.paths[640], image.paths[1080], image.paths[1600], image.paths[1080].replace(/-1080\.webp$/, "-og.jpg")] : [];
