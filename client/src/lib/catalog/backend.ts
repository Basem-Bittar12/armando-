/**
 * مصدر البيانات: واجهة واحدة لها تنفيذان — محلي (تجريبي، بالذاكرة) وSupabase (لاحقاً).
 * المتجر (store.tsx) يحسب الحالة الجديدة ويتحقق من القواعد، ثم يطلب من المصدر حفظها.
 */
import { demoCatalog } from "./demoSeed";
import type { AreaRow, CatalogData, FullProperty, ImageRow, NewImage, OptionKind, OptionRow, Settings } from "./types";

export interface CatalogBackend {
  /** "local" = بيانات تجريبية بالذاكرة؛ "supabase" = حقيقية */
  readonly kind: "local" | "supabase";
  load(): Promise<CatalogData>;
  /** يرفع الصور الجديدة ويحفظ العقار؛ يعيده بصوره النهائية */
  saveProperty(property: FullProperty, newImages: NewImage[], removedImages: ImageRow[]): Promise<FullProperty>;
  /** يحذف ملفات الصور أولاً؛ إن فشل الحذف لا يُحذف العقار */
  deleteProperty(property: FullProperty): Promise<void>;
  patchProperties(patches: { id: string; patch: Partial<FullProperty> }[]): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
  saveOption(kind: OptionKind, row: OptionRow | AreaRow): Promise<OptionRow | AreaRow>;
  deleteOption(kind: OptionKind, id: string): Promise<void>;
  reorderOptions(kind: OptionKind, ids: string[]): Promise<void>;
  uploadAreaCover(areaId: string, image: NewImage): Promise<string>;
}

/** المصدر المحلي: كل شيء بالذاكرة (التحديث يعيد البيانات التجريبية) — للتطوير والاختبارات */
export function localBackend(): CatalogBackend {
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
    uploadAreaCover: async (_areaId, image) => URL.createObjectURL(image.blobs[1080]),
  };
}
