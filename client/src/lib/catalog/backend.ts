/**
 * مصدر البيانات: واجهة واحدة لها تنفيذان — محلي (تجريبي، بالذاكرة) وSupabase (حقيقي).
 * المتجر (store.tsx) يحسب الحالة الجديدة ويتحقق من القواعد، ثم يطلب من المصدر حفظها.
 * يُختار Supabase تلقائياً متى وُجد VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY.
 */
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { demoCatalog } from "./demoSeed";
import { OPTION_COLUMNS, PROPERTY_COLUMNS, areaFromDb, imageFromDb, must, toCatalogError, type DbImage } from "./supabaseShared";
import {
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
// Supabase: القراءة وإرسال الاستفسار هنا؛ الكتابة بملف supabaseAdmin.ts (lazy)
// ---------------------------------------------------------------------------

export function supabaseBackend(): CatalogBackend {
  const db = getSupabase();
  const ops = () => import("./supabaseAdmin").then((module) => module.adminOps(db));

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

    // الكتابة: تُحمَّل عند أول استعمال (لوحة التحكم فقط)
    saveProperty: (...args) => ops().then((o) => o.saveProperty(...args)),
    deleteProperty: (...args) => ops().then((o) => o.deleteProperty(...args)),
    patchProperties: (...args) => ops().then((o) => o.patchProperties(...args)),
    saveSettings: (...args) => ops().then((o) => o.saveSettings(...args)),
    saveOption: (...args) => ops().then((o) => o.saveOption(...args)),
    deleteOption: (...args) => ops().then((o) => o.deleteOption(...args)),
    reorderOptions: (...args) => ops().then((o) => o.reorderOptions(...args)),
    uploadAreaCover: (...args) => ops().then((o) => o.uploadAreaCover(...args)),
    listInquiries: () => ops().then((o) => o.listInquiries()),
    setInquiryStatus: (...args) => ops().then((o) => o.setInquiryStatus(...args)),
    deleteInquiry: (...args) => ops().then((o) => o.deleteInquiry(...args)),

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
  };
}

/** Supabase إن كان مربوطاً، وإلا البيانات التجريبية */
export const createBackend = (): CatalogBackend => (supabaseConfigured ? supabaseBackend() : localBackend());
