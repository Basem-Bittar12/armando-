/**
 * فحص الحماية فعلياً على Supabase:
 *  - بالمفتاح العام (زائر): القراءة العامة تنجح، وكل كتابة/رفع/قراءة مسودة تنرفض.
 *  - بمستخدم مسجّل غير مسؤول (يُنشأ للفحص ثم يُحذف): نفس الرفض، ولا يقدر يجعل نفسه مسؤولاً.
 * لا يغيّر أي بيانات حقيقية: مسودة الفحص تُنشأ وتُحذف بالـservice_role.
 * التشغيل: npx tsx scripts/check-rls.ts
 */
import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { anonClient, env, serviceClient } from "./env";

const admin = serviceClient();
let failures = 0;
const results: string[] = [];
const expect = (label: string, ok: boolean, detail = "") => {
  results.push(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

// مسودة للفحص (غير منشورة)
const { data: city } = await admin.from("cities").select("id").limit(1).single();
const { data: type } = await admin.from("property_types").select("id").limit(1).single();
const { data: draft, error: draftError } = await admin
  .from("properties")
  .insert({ title: "مسودة فحص الحماية", city_id: city!.id, type_id: type!.id, is_published: false, code: `RLS-${Date.now() % 100000}` })
  .select("id")
  .single();
if (draftError || !draft) throw new Error(`إنشاء مسودة الفحص: ${draftError?.message}`);
const { data: published } = await admin.from("properties").select("id").eq("is_published", true).limit(1).maybeSingle();

async function attack(who: string, client: SupabaseClient) {
  // القراءة العامة
  const { data: visible, error: readError } = await client.from("properties").select("id,is_published");
  expect(`${who}: قراءة العقارات`, !readError, readError?.message ?? `${visible?.length ?? 0} عقار`);
  expect(`${who}: لا يرى المسودات`, !!visible && visible.every((p) => p.is_published));
  const { data: draftSeen } = await client.from("properties").select("id").eq("id", draft!.id);
  expect(`${who}: المسودة مخفية`, (draftSeen ?? []).length === 0);
  const { data: opts, error: optsError } = await client.from("cities").select("id,is_active");
  expect(`${who}: قراءة الخيارات المفعّلة فقط`, !optsError && (opts ?? []).every((o) => o.is_active));

  // الكتابة
  const ins = await client.from("properties").insert({ title: "هجوم", city_id: city!.id, type_id: type!.id }).select("id");
  expect(`${who}: إضافة عقار مرفوضة`, !!ins.error || (ins.data ?? []).length === 0, ins.error?.message ?? "");
  if (published) {
    const upd = await client.from("properties").update({ title: "هجوم" }).eq("id", published.id).select("id");
    expect(`${who}: تعديل عقار منشور مرفوض`, !!upd.error || (upd.data ?? []).length === 0, upd.error?.message ?? "0 صفوف");
    const del = await client.from("properties").delete().eq("id", published.id).select("id");
    expect(`${who}: حذف عقار مرفوض`, !!del.error || (del.data ?? []).length === 0, del.error?.message ?? "0 صفوف");
    const price = await client.from("property_prices").update({ amount: 1 }).eq("property_id", published.id).select("id");
    expect(`${who}: تعديل سعر مرفوض`, !!price.error || (price.data ?? []).length === 0, price.error?.message ?? "0 صفوف");
  }
  const settings = await client.from("settings").update({ home_count: 24 }).eq("id", 1).select("id");
  expect(`${who}: تعديل الإعدادات مرفوض`, !!settings.error || (settings.data ?? []).length === 0, settings.error?.message ?? "0 صفوف");
  const city2 = await client.from("cities").insert({ name_ar: "هجوم" }).select("id");
  expect(`${who}: إضافة مدينة مرفوضة`, !!city2.error || (city2.data ?? []).length === 0, city2.error?.message ?? "");

  // التخزين
  const tiny = new Blob([new Uint8Array([82, 73, 70, 70])], { type: "image/webp" });
  const up = await client.storage.from("property-images").upload(`rls-test/${Date.now()}.webp`, tiny);
  expect(`${who}: رفع صورة مرفوض`, !!up.error, up.error?.message ?? "نجح الرفع!");
  const { data: someImage } = await admin.from("property_images").select("path_640").limit(1).maybeSingle();
  if (someImage) {
    const rm = await client.storage.from("property-images").remove([someImage.path_640]);
    const still = await fetch(`${env.url}/storage/v1/object/public/property-images/${someImage.path_640}`);
    expect(`${who}: حذف صورة مرفوض`, still.ok, `${rm.error?.message ?? `${rm.data?.length ?? 0} محذوف`}، الصورة ما زالت: ${still.status}`);
  }
}

// زائر
await attack("زائر", anonClient());

// مستخدم مسجّل غير مسؤول
const email = `rls-check-${Date.now()}@example.com`;
const password = randomBytes(18).toString("base64url");
const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (createError || !created.user) throw new Error(`إنشاء مستخدم الفحص: ${createError?.message}`);
try {
  const user = createClient(env.url, env.anonKey, { auth: { persistSession: false } });
  const { error: signInError } = await user.auth.signInWithPassword({ email, password });
  expect("مستخدم الفحص سجّل دخول", !signInError, signInError?.message ?? "");
  await attack("مستخدم غير مسؤول", user);
  const selfAdmin = await user.from("admins").insert({ user_id: created.user.id }).select("user_id");
  expect("مستخدم غير مسؤول: لا يقدر يجعل نفسه مسؤولاً", !!selfAdmin.error || (selfAdmin.data ?? []).length === 0, selfAdmin.error?.message ?? "");
  // التسجيل العام مقفل؟
  const signUp = await anonClient().auth.signUp({ email: `signup-${Date.now()}@example.com`, password });
  expect("التسجيل العام مقفل", !!signUp.error, signUp.error?.message ?? "التسجيل مفتوح!");
  if (signUp.data.user) await admin.auth.admin.deleteUser(signUp.data.user.id);
} finally {
  await admin.auth.admin.deleteUser(created.user.id);
  await admin.from("properties").delete().eq("id", draft.id);
}

console.log(results.join("\n"));
console.log(failures ? `\n✗ ${failures} فحص فشل` : "\n✓ كل فحوص الحماية نجحت");
process.exit(failures ? 1 : 0);
