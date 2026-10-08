/**
 * يعرض الملفات اليتيمة بالتخزين: صور موجودة بـ Storage وما إلها سطر بالقاعدة
 * (مثلاً لو انقطع النت بنص حذف عقار). لا يحذف شيئاً إلا مع --delete.
 * التشغيل: npx tsx scripts/orphan-files.ts            (عرض فقط)
 *          npx tsx scripts/orphan-files.ts --delete   (حذف اليتيم)
 */
import { serviceClient } from "./env";

const db = serviceClient();
const remove = process.argv.includes("--delete");

async function listAll(bucket: string): Promise<string[]> {
  const files: string[] = [];
  const { data: folders, error } = await db.storage.from(bucket).list("", { limit: 1000 });
  if (error) throw new Error(`${bucket}: ${error.message}`);
  for (const entry of folders ?? []) {
    if (entry.id) {
      files.push(entry.name);
      continue;
    }
    // مجلد (عقار أو منطقة)
    for (let offset = 0; ; offset += 1000) {
      const { data, error: listError } = await db.storage.from(bucket).list(entry.name, { limit: 1000, offset });
      if (listError) throw new Error(`${bucket}/${entry.name}: ${listError.message}`);
      files.push(...(data ?? []).filter((file) => file.id).map((file) => `${entry.name}/${file.name}`));
      if (!data || data.length < 1000) break;
    }
  }
  return files;
}

const { data: images, error: imagesError } = await db.from("property_images").select("path_640,path_1080,path_1600");
if (imagesError) throw new Error(imagesError.message);
const { data: areas, error: areasError } = await db.from("areas").select("cover_path");
if (areasError) throw new Error(areasError.message);

const known = {
  "property-images": new Set((images ?? []).flatMap((row) => [row.path_640, row.path_1080, row.path_1600])),
  "area-covers": new Set((areas ?? []).map((row) => row.cover_path).filter(Boolean) as string[]),
};

let total = 0;
for (const bucket of Object.keys(known) as (keyof typeof known)[]) {
  const orphans = (await listAll(bucket)).filter((path) => !known[bucket].has(path));
  total += orphans.length;
  console.log(`${bucket}: ${orphans.length} ملف يتيم`);
  for (const path of orphans) console.log(`  · ${path}`);
  if (remove && orphans.length) {
    const { error } = await db.storage.from(bucket).remove(orphans);
    console.log(error ? `  ✗ الحذف: ${error.message}` : `  ✓ انحذف ${orphans.length}`);
  }
}
if (!total) console.log("✓ ما في ملفات يتيمة");
