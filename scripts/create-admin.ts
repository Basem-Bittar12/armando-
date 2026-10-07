/**
 * إضافة مسؤول للوحة التحكم: ينشئ حساب Supabase Auth (بكلمة سر عشوائية لا تُعرض لأحد) ويضيفه لجدول admins.
 * صاحب الإيميل يضع كلمة سره بنفسه من «نسيت كلمة السر» في صفحة دخول اللوحة.
 * التشغيل: npx tsx scripts/create-admin.ts name@example.com
 */
import { randomBytes } from "node:crypto";
import { serviceClient } from "./env";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("الاستعمال: npx tsx scripts/create-admin.ts name@example.com");
  process.exit(1);
}

const db = serviceClient();
let userId: string | undefined;

const { data: created, error } = await db.auth.admin.createUser({
  email,
  password: randomBytes(24).toString("base64url"),
  email_confirm: true,
});
if (created?.user) {
  userId = created.user.id;
  console.log(`✓ أُنشئ الحساب ${email}`);
} else if (error && /already/i.test(error.message)) {
  // الحساب موجود: نبحث عنه
  for (let page = 1; !userId && page < 20; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 200 });
    userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
    if (!data.users.length) break;
  }
  console.log(`· الحساب ${email} موجود سابقاً`);
} else {
  console.error(`✗ ${error?.message}`);
  process.exit(1);
}
if (!userId) {
  console.error("✗ لم أجد الحساب");
  process.exit(1);
}

const { error: adminError } = await db.from("admins").upsert({ user_id: userId });
if (adminError) {
  console.error(`✗ إضافة لجدول admins: ${adminError.message}`);
  process.exit(1);
}
console.log(`✓ ${email} صار مسؤولاً`);
