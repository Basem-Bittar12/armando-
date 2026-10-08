/** ينشئ مسؤول اختبار مؤقت (يُحذف بالـteardown) — نفس طريقة scripts/create-admin.ts */
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { ADMIN_FILE, service } from "./support";

export default async function globalSetup() {
  const db = service();
  const email = `e2e-admin-${Date.now()}@example.com`;
  const password = randomBytes(18).toString("base64url");
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(`test admin: ${error?.message}`);
  const { error: adminError } = await db.from("admins").insert({ user_id: data.user.id });
  if (adminError) throw new Error(`admins row: ${adminError.message}`);
  writeFileSync(ADMIN_FILE, JSON.stringify({ id: data.user.id, email, password }));
}
