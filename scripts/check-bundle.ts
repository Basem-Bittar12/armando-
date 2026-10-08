/**
 * فحص ملفات البناء قبل النشر (يوقف النشر عند الخطأ):
 *  1) مفتاح service_role لا يظهر بأي ملف داخل dist/public (لا بقيمته ولا كـ JWT دوره service_role ولا كمفتاح sb_secret_).
 *  2) كود لوحة التحكم ليس داخل الملف الرئيسي للموقع (اللوحة قطعة lazy منفصلة).
 * التشغيل: npx tsx scripts/check-bundle.ts (بعد vite build)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const root = join(process.cwd(), "dist", "public");
const files: string[] = [];
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(js|css|html|json|txt|xml|map|webmanifest)$/.test(name)) files.push(path);
  }
};
walk(root);

const problems: string[] = [];
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const name = relative(root, file);
  if (serviceKey && text.includes(serviceKey)) problems.push(`${name}: فيه قيمة SUPABASE_SERVICE_ROLE_KEY`);
  if (/SUPABASE_SERVICE_ROLE_KEY|sb_secret_[A-Za-z0-9_-]{10,}/.test(text)) problems.push(`${name}: فيه اسم/شكل مفتاح سري`);
  for (const jwt of text.match(/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g) ?? []) {
    try {
      const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"));
      if (payload.role === "service_role") problems.push(`${name}: فيه JWT بدور service_role`);
    } catch {
      // ليس JWT
    }
  }
}

// الملف الرئيسي = السكربت المحمّل من index.html
const html = readFileSync(join(root, "index.html"), "utf8");
const entries = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]);
for (const entry of entries) {
  const text = readFileSync(join(root, entry), "utf8");
  if (/adm-savebar|adm-login__card|save_property|reorder_options/.test(text)) problems.push(`${entry}: فيه كود لوحة التحكم (لازم يكون بقطعة منفصلة)`);
}

console.log(`فحص ${files.length} ملف، الملفات الرئيسية: ${entries.join(", ")}`);
if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join("\n"));
  process.exit(1);
}
console.log("✓ لا مفاتيح سرية بملفات الموقع، واللوحة خارج الملف الرئيسي");
