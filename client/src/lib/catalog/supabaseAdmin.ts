/**
 * عمليات الكتابة على Supabase (لوحة التحكم فقط) — ملف منفصل يُحمَّل عند أول تعديل،
 * فلا يدخل كود الحفظ والرفع في ملف الموقع العام. الحماية الفعلية بـ RLS بالقاعدة.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { AREA_COVERS_BUCKET, IMAGES_BUCKET, publicUrl } from "@/lib/supabase";
import type { CatalogBackend } from "./backend";
import { CatalogError, type ImageRow, type Inquiry, type OptionRow } from "./types";
import { OPTION_COLUMNS, PATCHABLE, PROPERTY_COLUMNS, areaFromDb, imageFromDb, imagePaths, must, pick, toCatalogError } from "./supabaseShared";
import type { AreaRow } from "./types";

type AdminOps = Omit<CatalogBackend, "kind" | "load" | "submitInquiry">;

export function adminOps(db: SupabaseClient): AdminOps {
  return {
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
          if (image.og) {
            const ogPath = `${property.id}/${image.id}-og.jpg`;
            const { error } = await db.storage
              .from(IMAGES_BUCKET)
              .upload(ogPath, image.og, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
            if (error) throw new CatalogError("storage", `ما قدرت أرفع الصورة: ${error.message}`);
            uploaded.push(ogPath);
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
