/**
 * نقل عقارات دبي الوهمية الحالية إلى Supabase كعقارات تجريبية (is_demo = true) حتى لا يفضى الموقع.
 * يحمّل الصور، يصغّرها لـ640/1080/1600 WebP، يرفعها، ويكتب الأسعار والمرافق. آمن للتكرار: يتجاوز الكود الموجود.
 * التشغيل: npx tsx scripts/seed-demo.ts
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { serviceClient } from "./env";
import { uploadImageSet } from "./images";
import { demoProperties } from "./demo-properties";

const db = serviceClient();

const one = async <T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>, label: string): Promise<NonNullable<T>> => {
  const { data, error } = await query;
  if (error || !data) throw new Error(`${label}: ${error?.message ?? "لا بيانات"}`);
  return data as NonNullable<T>;
};

const cities = await one(db.from("cities").select("id,name_ar"), "المدن");
const areas = await one(db.from("areas").select("id,name_ar,city_id"), "المناطق");
const types = await one(db.from("property_types").select("id,name_ar"), "الأنواع");
const terms = await one(db.from("rental_terms").select("id,name_ar"), "أنواع الإيجار");
const amenities = await one(db.from("amenities").select("id,name_ar"), "المرافق");
const idOf = (list: { id: string; name_ar: string }[], name: string, label: string) => {
  const found = list.find((item) => item.name_ar === name);
  if (!found) throw new Error(`${label} غير موجود: ${name}`);
  return found.id;
};

/**
 * صورة العقار التجريبي من Unsplash. إن تعذّر تحميلها (بدون إنترنت أو شبكة مقفلة) نستعمل فريمات
 * الغرفة المكتملة من قصة الهيرو الموجودة بالمشروع، حتى يبقى للعقار التجريبي صور.
 */
const FALLBACK_FRAMES = ["084", "078", "070", "062"];
async function loadImage(url: string, index: number): Promise<Buffer> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (response.ok) return Buffer.from(await response.arrayBuffer());
  } catch {
    // نكمل بالبديل
  }
  const frame = FALLBACK_FRAMES[index % FALLBACK_FRAMES.length];
  console.log(`  · تعذّر تحميل ${url.slice(0, 60)}… — استعملت فريم الهيرو ${frame}`);
  return readFileSync(join(process.cwd(), "client/public/hero-frames/desktop", `${frame}.webp`));
}

let homeOrder = 1;
for (const demo of demoProperties) {
  const { data: existing } = await db.from("properties").select("id").eq("code", demo.code).maybeSingle();
  if (existing) {
    console.log(`· ${demo.code} موجود سابقاً — تجاوز`);
    continue;
  }
  const cityId = idOf(cities, demo.city, "المدينة");
  const property = (await one(
    db
      .from("properties")
      .insert({
        code: demo.code,
        title: demo.title,
        description: demo.description,
        city_id: cityId,
        area_id: idOf(areas.filter((a) => a.city_id === cityId), demo.area, "المنطقة"),
        type_id: idOf(types, demo.type, "النوع"),
        bedrooms: demo.bedrooms,
        bathrooms: demo.bathrooms,
        area_sqft: demo.areaSqft,
        floor: demo.floor,
        year_built: demo.yearBuilt,
        furnished: demo.furnished,
        min_rent_period: demo.minRent,
        status: demo.status,
        is_new: demo.isNew,
        is_published: true,
        show_on_home: true,
        home_order: homeOrder++,
        is_demo: true,
      })
      .select("id")
      .single(),
    `إضافة ${demo.code}`,
  )) as unknown as { id: string };

  for (const price of demo.prices) {
    await one(
      db.from("property_prices").insert({ property_id: property.id, rental_term_id: idOf(terms, price.term, "نوع الإيجار"), amount: price.amount }).select("id"),
      "السعر",
    );
  }
  if (demo.amenities.length) {
    await one(
      db
        .from("property_amenities")
        .insert(demo.amenities.map((name) => ({ property_id: property.id, amenity_id: idOf(amenities, name, "المرفق") })))
        .select("amenity_id"),
      "المرافق",
    );
  }

  for (const [index, url] of demo.gallery.entries()) {
    const set = await uploadImageSet(db, await loadImage(url, index), property.id, randomUUID());
    await one(db.from("property_images").insert({ property_id: property.id, sort_order: index, ...set }).select("id"), "سطر الصورة");
  }
  console.log(`✓ ${demo.code} — ${demo.title} (${demo.gallery.length} صور)`);
}
