/**
 * مصدر البيانات: واجهة واحدة لها تنفيذان — محلي (تجريبي، بالذاكرة) وSupabase (حقيقي).
 * المتجر (store.tsx) يحسب الحالة الجديدة ويتحقق من القواعد، ثم يطلب من المصدر حفظها.
 * يُختار Supabase تلقائياً متى وُجد VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY.
 */
import { AREA_COVERS_BUCKET, IMAGES_BUCKET, getSupabase, publicUrl, supabaseConfigured } from "@/lib/supabase";
import { demoCatalog } from "./demoSeed";
import {
  CatalogError,
  type AreaRow,
  type CatalogData,
  type FullProperty,
  type ImageRow,
  type Inquiry,
  type InquiryInput,
  type InquiryStatus,
  type NewImage,
  type OptionKind,
  type OptionRow,
  type Settings,
} from "./types";

export interface CatalogBackend {
  /** "local" = بيانات تجريبية بالذاكرة؛ "supabase" = حقيقية */
  readonly kind: "local" | "supabase";
  load(): Promise<CatalogData>;
  /** يرفع الصور الجديدة ويحفظ العقار؛ يعيده بصوره النهائية */
  saveProperty(property: FullProperty, newImages: NewImage[], removedImages: ImageRow[]): Promise<FullProperty>;
  /** يحذف العقار ثم ملفات صوره */
  deleteProperty(property: FullProperty): Promise<void>;
  patchProperties(patches: { id: string; patch: Partial<FullProperty> }[]): Promise<void>;
  saveSettings(patch: Partial<Settings>): Promise<void>;
  saveOption(kind: OptionKind, row: OptionRow | AreaRow): Promise<OptionRow | AreaRow>;
  deleteOption(kind: OptionKind, id: string): Promise<void>;
  reorderOptions(kind: OptionKind, ids: string[]): Promise<void>;
  uploadAreaCover(area: AreaRow, image: NewImage): Promise<{ url: string; path: string | null }>;
  submitInquiry(input: InquiryInput): Promise<void>;
  listInquiries(): Promise<Inquiry[]>;
  setInquiryStatus(id: string, status: InquiryStatus): Promise<void>;
  deleteInquiry(id: string): Promise<void>;
}

/** المصدر المحلي: كل شيء بالذاكرة (التحديث يعيد البيانات التجريبية) — للتطوير والاختبارات */
export function localBackend(): CatalogBackend {
  let inquiries: Inquiry[] = [];
  return {
    kind: "local",
    load: async () => demoCatalog(),
    saveProperty: async (property, newImages) => {
      const saved = new Map(newImages.map((image) => [image.id, image]));
      return {
        ...property,
        images: property.images.map((row) => {
          const fresh = saved.get(row.id);
          if (!fresh) return row;
          // معاينة محلية لكل مقاس (النسخ الثلاث موجودة كـ Blob)
          return {
            ...row,
            src_640: URL.createObjectURL(fresh.blobs[640]),
            src_1080: URL.createObjectURL(fresh.blobs[1080]),
            src_1600: URL.createObjectURL(fresh.blobs[1600]),
          };
        }),
      };
    },
    deleteProperty: async () => {},
    patchProperties: async () => {},
    saveSettings: async () => {},
    saveOption: async (_kind, row) => row,
    deleteOption: async () => {},
    reorderOptions: async () => {},
    uploadAreaCover: async (_area, image) => ({ url: URL.createObjectURL(image.blobs[1080]), path: null }),
    submitInquiry: async (input) => {
      if (input.website) return;
      inquiries = [
        {
          id: `inq-${Date.now()}`,
          name: input.name,
          phone: input.phone,
          rental_term: input.rental_term ?? null,
          city: input.city ?? null,
          message: input.message ?? null,
          property_code: input.property_code ?? null,
          status: "جديد",
          created_at: new Date().toISOString(),
        },
        ...inquiries,
      ];
    },
    listInquiries: async () => inquiries,
    setInquiryStatus: async (id, status) => {
      inquiries = inquiries.map((item) => (item.id === id ? { ...item, status } : item));
    },
    deleteInquiry: async (id) => {
      inquiries = inquiries.filter((item) => item.id !== id);
    },
  };
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

type DbError = { message: string; code?: string; details?: string | null; hint?: string | null } | null;

/** خطأ Supabase → رسالة يفهمها صاحب الموقع */
function toCatalogError(error: DbError | Error, fallback = "صار خطأ بالحفظ — جرّب مرة ثانية"): CatalogError {
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

async function must<T>(query: PromiseLike<{ data: T; error: DbError }>): Promise<T> {
  const { data, error } = await query;
  if (error) throw toCatalogError(error);
  return data;
}

const OPTION_COLUMNS: Record<OptionKind, string[]> = {
  cities: ["id", "name_ar", "name_en", "sort_order", "is_active"],
  areas: ["id", "city_id", "name_ar", "name_en", "cover_path", "sort_order", "is_active"],
  property_types: ["id", "name_ar", "name_en", "sort_order", "is_active"],
  rental_terms: ["id", "name_ar", "name_en", "unit_ar", "unit_en", "sort_order", "is_active"],
  amenities: ["id", "name_ar", "name_en", "sort_order", "is_active"],
};

const PROPERTY_COLUMNS = [
  "id", "code", "title", "description", "city_id", "area_id", "type_id", "bedrooms", "bathrooms", "area_sqft", "floor",
  "year_built", "furnished", "min_rent_period", "max_guests", "map_url", "permit_no", "available_from", "status",
  "is_new", "is_published", "show_on_home", "home_order", "is_demo", "updated_at",
] as const;
/** حقول تقبلها التعديلات السريعة من القائمة */
const PATCHABLE = new Set(["is_published", "status", "show_on_home", "home_order", "is_new"]);

const pick = (row: Record<string, unknown>, keys: readonly string[]) =>
  Object.fromEntries(keys.filter((key) => key in row).map((key) => [key, row[key]]));

type DbImage = { id: string; sort_order: number; path_640: string; path_1080: string; path_1600: string; width: number | null; height: number | null };

const imageFromDb = (row: DbImage): ImageRow => ({
  id: row.id,
  sort_order: row.sort_order,
  src_640: publicUrl(IMAGES_BUCKET, row.path_640),
  src_1080: publicUrl(IMAGES_BUCKET, row.path_1080),
  src_1600: publicUrl(IMAGES_BUCKET, row.path_1600),
  paths: { 640: row.path_640, 1080: row.path_1080, 1600: row.path_1600 },
  width: row.width,
  height: row.height,
});

const areaFromDb = (row: Omit<AreaRow, "cover_url">): AreaRow => ({
  ...row,
  cover_url: row.cover_path ? publicUrl(AREA_COVERS_BUCKET, row.cover_path) : null,
});

const imagePaths = (image: ImageRow) => (image.paths ? [image.paths[640], image.paths[1080], image.paths[1600]] : []);

export function supabaseBackend(): CatalogBackend {
  const db = getSupabase();

  return {
    kind: "supabase",

    async load() {
      const [cities, areas, types, terms, amenities, properties, settings] = await Promise.all([
        must(db.from("cities").select(OPTION_COLUMNS.cities.join(","))),
        must(db.from("areas").select(OPTION_COLUMNS.areas.join(","))),
        must(db.from("property_types").select(OPTION_COLUMNS.property_types.join(","))),
        must(db.from("rental_terms").select(OPTION_COLUMNS.rental_terms.join(","))),
        must(db.from("amenities").select(OPTION_COLUMNS.amenities.join(","))),
        must(
          db
            .from("properties")
            .select(
              `${PROPERTY_COLUMNS.join(",")},property_prices(rental_term_id,amount),property_images(id,sort_order,path_640,path_1080,path_1600,width,height),property_amenities(amenity_id)`,
            ),
        ),
        must(db.from("settings").select("home_count,phone,whatsapp,email,address,hours,social").eq("id", 1).single()),
      ]);
      type DbProperty = FullProperty & {
        property_prices: { rental_term_id: string; amount: number }[];
        property_images: DbImage[];
        property_amenities: { amenity_id: string }[];
      };
      return {
        cities: cities as unknown as OptionRow[],
        areas: (areas as unknown as Omit<AreaRow, "cover_url">[]).map(areaFromDb),
        property_types: types as unknown as OptionRow[],
        rental_terms: terms as unknown as CatalogData["rental_terms"],
        amenities: amenities as unknown as OptionRow[],
        properties: (properties as unknown as DbProperty[]).map(({ property_prices, property_images, property_amenities, ...row }) => ({
          ...row,
          prices: property_prices.map((price) => ({ rental_term_id: price.rental_term_id, amount: Number(price.amount) })),
          images: [...property_images].sort((a, b) => a.sort_order - b.sort_order).map(imageFromDb),
          amenity_ids: property_amenities.map((item) => item.amenity_id),
        })),
        settings: settings as unknown as Settings,
      };
    },

    async saveProperty(property, newImages, removedImages) {
      // 1) رفع الصور الجديدة أولاً (ثلاث نسخ لكل صورة)
      const uploaded: string[] = [];
      const fresh = new Map<string, ImageRow["paths"]>();
      try {
        for (const image of newImages) {
          const paths = { 640: "", 1080: "", 1600: "" } as NonNullable<ImageRow["paths"]>;
          for (const width of [640, 1080, 1600] as const) {
            const path = `${property.id}/${image.id}-${width}.webp`;
            const { error } = await db.storage
              .from(IMAGES_BUCKET)
              .upload(path, image.blobs[width], { contentType: "image/webp", cacheControl: "31536000", upsert: false });
            if (error) throw new CatalogError("storage", `ما قدرت أرفع الصورة: ${error.message}`);
            uploaded.push(path);
            paths[width] = path;
          }
          fresh.set(image.id, paths);
        }

        // 2) حفظ العقار وأسعاره ومرافقه وترتيب صوره بعملية واحدة
        const images = property.images.map((image, index) => {
          const paths = fresh.get(image.id) ?? image.paths;
          if (!paths) throw new CatalogError("invalid", "صورة بدون ملف — احذفها وأضفها من جديد");
          return { id: image.id, sort_order: index, path_640: paths[640], path_1080: paths[1080], path_1600: paths[1600], width: image.width ?? null, height: image.height ?? null };
        });
        await must(
          db.rpc("save_property", {
            p: pick(property as unknown as Record<string, unknown>, PROPERTY_COLUMNS.filter((key) => key !== "is_demo" && key !== "updated_at")),
            prices: property.prices,
            amenity_ids: property.amenity_ids,
            images,
          }),
        );
      } catch (error) {
        // الحفظ فشل: نشيل الصور اللي انرفعت حتى ما تضل ملفات يتيمة
        if (uploaded.length) await db.storage.from(IMAGES_BUCKET).remove(uploaded);
        throw toCatalogError(error as Error);
      }

      // 3) حذف ملفات الصور المشالة (بعد نجاح الحفظ فقط)
      const stale = removedImages.flatMap(imagePaths);
      if (stale.length) {
        const { error } = await db.storage.from(IMAGES_BUCKET).remove(stale);
        if (error) console.warn("[Catalog] old image files not removed (see scripts/orphan-files.ts)", error.message);
      }

      return {
        ...property,
        images: property.images.map((image, index) => {
          const paths = fresh.get(image.id) ?? image.paths!;
          return imageFromDb({ id: image.id, sort_order: index, path_640: paths[640], path_1080: paths[1080], path_1600: paths[1600], width: image.width ?? null, height: image.height ?? null });
        }),
        updated_at: new Date().toISOString(),
      };
    },

    async deleteProperty(property) {
      // السطر أولاً (الأسعار والصور والمرافق تنحذف معه)، ثم كل ملفات مجلد العقار
      const deleted = await must(db.from("properties").delete().eq("id", property.id).select("id"));
      if (!deleted?.length) throw new CatalogError("invalid", "ما انحذف العقار — يمكن ما عندك صلاحية");
      const known = property.images.flatMap(imagePaths);
      const { data: listed } = await db.storage.from(IMAGES_BUCKET).list(property.id, { limit: 1000 });
      const files = Array.from(new Set([...known, ...(listed ?? []).map((file) => `${property.id}/${file.name}`)]));
      if (files.length) {
        const { error } = await db.storage.from(IMAGES_BUCKET).remove(files);
        if (error) console.warn("[Catalog] image files not removed (see scripts/orphan-files.ts)", error.message);
      }
    },

    async patchProperties(patches) {
      const onlyOrder = patches.length > 1 && patches.every(({ patch }) => Object.keys(patch).every((key) => key === "home_order"));
      if (onlyOrder) {
        const ids = [...patches].sort((a, b) => (a.patch.home_order ?? 0) - (b.patch.home_order ?? 0)).map((item) => item.id);
        await must(db.rpc("reorder_home", { ids }));
        return;
      }
      for (const { id, patch } of patches) {
        const fields = Object.fromEntries(Object.entries(patch).filter(([key]) => PATCHABLE.has(key)));
        const rows = await must(db.from("properties").update(fields).eq("id", id).select("id"));
        if (!rows?.length) throw new CatalogError("invalid", "ما انحفظ التعديل — سجّل دخول من جديد");
      }
    },

    async saveSettings(patch) {
      const rows = await must(db.from("settings").update(patch).eq("id", 1).select("id"));
      if (!rows?.length) throw new CatalogError("invalid", "ما انحفظت الإعدادات — سجّل دخول من جديد");
    },

    async saveOption(kind, row) {
      const saved = await must(
        db.from(kind).upsert(pick(row as unknown as Record<string, unknown>, OPTION_COLUMNS[kind])).select(OPTION_COLUMNS[kind].join(",")).single(),
      );
      return kind === "areas" ? areaFromDb(saved as unknown as AreaRow) : (saved as unknown as OptionRow);
    },

    async deleteOption(kind, id) {
      const rows = await must(db.from(kind).delete().eq("id", id).select("id"));
      if (!rows?.length) throw new CatalogError("invalid", "ما انحذف — سجّل دخول من جديد");
    },

    async reorderOptions(kind, ids) {
      await must(db.rpc("reorder_options", { kind, ids }));
    },

    async uploadAreaCover(area, image) {
      const path = `${area.id}/${image.id}.webp`;
      const { error } = await db.storage
        .from(AREA_COVERS_BUCKET)
        .upload(path, image.blobs[1080], { contentType: "image/webp", cacheControl: "31536000", upsert: false });
      if (error) throw new CatalogError("storage", `ما قدرت أرفع الصورة: ${error.message}`);
      try {
        const rows = await must(db.from("areas").update({ cover_path: path }).eq("id", area.id).select("id"));
        if (!rows?.length) throw new CatalogError("invalid", "ما انحفظت الصورة — سجّل دخول من جديد");
      } catch (saveError) {
        await db.storage.from(AREA_COVERS_BUCKET).remove([path]);
        throw saveError;
      }
      if (area.cover_path) await db.storage.from(AREA_COVERS_BUCKET).remove([area.cover_path]);
      return { url: publicUrl(AREA_COVERS_BUCKET, path), path };
    },

    async submitInquiry(input) {
      // بدون .select(): الزائر يقدر يضيف بس ما يقدر يقرأ
      const { error } = await db.from("inquiries").insert({
        name: input.name,
        phone: input.phone,
        rental_term: input.rental_term || null,
        city: input.city || null,
        message: input.message || null,
        property_code: input.property_code || null,
        website: input.website ?? "",
      });
      if (error) throw toCatalogError(error, "ما وصل الطلب — جرّب مرة ثانية أو راسلنا على واتساب");
    },

    async listInquiries() {
      return (await must(
        db.from("inquiries").select("id,name,phone,rental_term,city,message,property_code,status,created_at").order("created_at", { ascending: false }).limit(500),
      )) as Inquiry[];
    },

    async setInquiryStatus(id, status) {
      const rows = await must(db.from("inquiries").update({ status }).eq("id", id).select("id"));
      if (!rows?.length) throw new CatalogError("invalid", "ما انحفظت الحالة — سجّل دخول من جديد");
    },

    async deleteInquiry(id) {
      const rows = await must(db.from("inquiries").delete().eq("id", id).select("id"));
      if (!rows?.length) throw new CatalogError("invalid", "ما انحذف — سجّل دخول من جديد");
    },
  };
}

/** Supabase إن كان مربوطاً، وإلا البيانات التجريبية */
export const createBackend = (): CatalogBackend => (supabaseConfigured ? supabaseBackend() : localBackend());
