/** يحذف مسؤول الاختبار وأي عقار أو طلب تركه اختبار فشل بالنص */
import { existsSync, rmSync } from "node:fs";
import { ADMIN_FILE, service, testAdmin } from "./support";

export default async function globalTeardown() {
  const db = service();
  if (existsSync(ADMIN_FILE)) {
    await db.auth.admin.deleteUser(testAdmin().id);
    rmSync(ADMIN_FILE);
  }
  const { data: leftovers } = await db.from("properties").select("id").like("code", "E2E-%");
  for (const row of leftovers ?? []) {
    const { data: files } = await db.storage.from("property-images").list(row.id);
    if (files?.length) await db.storage.from("property-images").remove(files.map((file) => `${row.id}/${file.name}`));
    await db.from("properties").delete().eq("id", row.id);
  }
  await db.from("inquiries").delete().like("message", "e2e:%");
}
