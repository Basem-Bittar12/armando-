/**
 * خريطة الموقع وقت البناء: الصفحات الثابتة + كل العقارات المنشورة (من Supabase بالمفتاح العام).
 * تُكتب في dist/public/sitemap.xml مع robots.txt. الموقع يبقى noindex حتى الإطلاق (config/site.ts → indexing).
 * عنوان الموقع: SITE_URL، أو URL الذي يضعه Netlify تلقائياً وقت البناء.
 * التشغيل: npx tsx scripts/sitemap.ts (بعد vite build)
 */
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const out = join(process.cwd(), "dist", "public");
const site = (process.env.SITE_URL || process.env.URL || "").replace(/\/$/, "");
const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!existsSync(out)) {
  console.error("✗ dist/public غير موجود — شغّل vite build أولاً");
  process.exit(1);
}

const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let properties: { code: string; updated_at: string }[] = [];
if (supabaseUrl && anonKey) {
  const response = await fetch(`${supabaseUrl}/rest/v1/properties?select=code,updated_at&is_published=eq.true&order=updated_at.desc`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (response.ok) properties = await response.json();
  else console.warn(`· تعذّر جلب العقارات (${response.status}) — الخريطة بالصفحات الثابتة فقط`);
} else {
  console.warn("· Supabase غير مربوط — الخريطة بالصفحات الثابتة فقط");
}

const base = site || "https://example.invalid";
const urls = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/properties", changefreq: "daily", priority: "0.9" },
  { loc: "/contact", changefreq: "monthly", priority: "0.5" },
  ...properties.map((p) => ({ loc: `/property/${encodeURIComponent(p.code)}`, lastmod: p.updated_at.slice(0, 10), changefreq: "weekly", priority: "0.8" })),
];
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(
    (u) =>
      `  <url><loc>${escape(base + u.loc)}</loc>${"lastmod" in u && u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
  ),
  "</urlset>",
  "",
].join("\n");
writeFileSync(join(out, "sitemap.xml"), xml);

// robots.txt: اللوحة خارج الأرشفة دائماً؛ noindex الحالي يأتي من X-Robots-Tag (client/public/_headers)
writeFileSync(join(out, "robots.txt"), ["User-agent: *", "Disallow: /admin", site ? `Sitemap: ${site}/sitemap.xml` : "", ""].join("\n"));
console.log(`✓ sitemap.xml: ${urls.length} رابط (${properties.length} عقار)${site ? "" : " — بدون SITE_URL: الروابط مؤقتة"}`);
