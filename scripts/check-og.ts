/**
 * يشغّل Edge Function معاينة الروابط محلياً (نفس الكود الذي ينشر على Netlify) على index.html المبني
 * وعلى Supabase المربوط بـ .env.local، ويطبع الوسوم الناتجة.
 * التشغيل: npx tsx scripts/check-og.ts AK-102   (بعد vite build)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
(globalThis as unknown as { Netlify: unknown }).Netlify = { env: { get: (name: string) => process.env[name] } };
const { default: propertyOg } = await import("../netlify/edge-functions/property-og.ts");

const code = process.argv[2] ?? "AK-102";
const html = readFileSync(join(process.cwd(), "dist", "public", "index.html"), "utf8");
const response = await propertyOg(new Request(`https://preview.example/property/${code}`), {
  next: async () => new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } }),
});
const out = await response.text();
const tags = out.match(/<title>.*?<\/title>|<meta (?:property="og:[^"]+"|name="(?:description|twitter:[^"]+)")[^>]*>/g) ?? [];
console.log(tags.join("\n"));
if (!/og:image" content="[^"]+-(og\.jpg|1080\.webp)"/.test(out) || !out.includes(`— ${code} |`)) {
  console.error("✗ وسوم المعاينة ناقصة");
  process.exit(1);
}
console.log(`✓ معاينة ${code}: العنوان والسعر وصورة الغلاف`);
