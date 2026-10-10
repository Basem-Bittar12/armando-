/**
 * استرجاع نسخة احتياطية (من Worker «armando-ops») إلى Supabase.
 *
 * المصدر — واحد من:
 *   npx tsx scripts/restore-backup.ts backup.json            ملف محفوظ على الجهاز
 *   npx tsx scripts/restore-backup.ts --kv latest            آخر نسخة من Cloudflare KV
 *   npx tsx scripts/restore-backup.ts --kv backup:2026-…Z    نسخة معيّنة من KV
 *   npx tsx scripts/restore-backup.ts --list                 أسماء النسخ الموجودة في KV
 * (KV يحتاج CLOUDFLARE_ACCOUNT_ID وCLOUDFLARE_API_TOKEN بالبيئة؛ رقم الـnamespace يُقرأ من cloudflare/ops/wrangler.jsonc
 *  أو من CLOUDFLARE_KV_NAMESPACE_ID)
 *
 * الطريقة:
 *   (افتراضياً) merge    كل صف يُكتب فوق صفه بنفس المفتاح الأساسي، والصفوف الأحدث من النسخة تبقى.
 *                        مناسب لتراجع عن حذف أو تعديل بالغلط.
 *   --replace            تفريغ الجداول الموجودة بالنسخة ثم إدخالها كما هي: القاعدة تصير مطابقة للنسخة.
 *                        مناسب لمشروع جديد بعد كارثة (الـmigrations تضيف خيارات افتراضية تتعارض مع النسخة).
 *
 * الأمان: بدون --yes يطبع الخطة فقط ولا يكتب شيئاً. الهدف هو مشروع .env.local
 * (أو ملف آخر بـ --env .env.localstack). يستعمل service_role من ذلك الملف، ولا يطبعه.
 *
 * لا تشمل النسخة: حسابات الدخول (auth.users) وملفات الصور (Supabase Storage).
 * صفوف admins تُتجاوز إن لم يكن الحساب موجوداً — أنشئه بـ npm run admin:create.
 */
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { env } from "./env";

type ForeignKey = { column: string; table: string; references: string };
type TableBackup = { primary_key: string[]; foreign_keys: ForeignKey[]; rows: Record<string, unknown>[] };
type Backup = { format: string; version: number; created_at: string; source: string; tables: Record<string, TableBackup> };

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : undefined;
};

const envFile = option("--env");
if (envFile) config({ path: envFile, override: true, quiet: true });

/* ---------------------------------------------------------------- Cloudflare KV */

function kvBase() {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  let namespace = process.env.CLOUDFLARE_KV_NAMESPACE_ID?.trim();
  if (!namespace) {
    const wrangler = readFileSync("cloudflare/ops/wrangler.jsonc", "utf8");
    namespace = /"binding":\s*"BACKUPS",\s*"id":\s*"([0-9a-f]{32})"/.exec(wrangler)?.[1];
  }
  if (!account || !namespace) {
    console.error("✗ KV يحتاج CLOUDFLARE_ACCOUNT_ID ورقم الـnamespace (CLOUDFLARE_KV_NAMESPACE_ID أو wrangler.jsonc)");
    process.exit(1);
  }
  return `https://api.cloudflare.com/client/v4/accounts/${account}/storage/kv/namespaces/${namespace}`;
}

const kvHeaders = () => (process.env.CLOUDFLARE_API_TOKEN ? { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` } : {});

async function kvList(): Promise<string[]> {
  const names: string[] = [];
  let cursor = "";
  do {
    const response = await fetch(`${kvBase()}/keys?prefix=backup:${cursor ? `&cursor=${cursor}` : ""}`, { headers: kvHeaders() });
    const body = (await response.json()) as { success: boolean; result: { name: string }[]; result_info?: { cursor?: string }; errors?: unknown };
    if (!body.success) throw new Error(`KV list: ${JSON.stringify(body.errors)}`);
    names.push(...body.result.map((k) => k.name));
    cursor = body.result_info?.cursor ?? "";
  } while (cursor);
  return names.sort();
}

async function kvGet(key: string): Promise<string> {
  const response = await fetch(`${kvBase()}/values/${encodeURIComponent(key)}`, { headers: kvHeaders() });
  if (!response.ok) throw new Error(`KV get ${key}: HTTP ${response.status}`);
  return response.text();
}

/* ---------------------------------------------------------------- ترتيب الجداول */

/** الأب قبل الابن (cities قبل areas قبل properties…)، حسب العلاقات المحفوظة بالنسخة نفسها */
export function insertOrder(tables: Record<string, TableBackup>): string[] {
  const names = Object.keys(tables).sort();
  const done = new Set<string>();
  const order: string[] = [];
  const visit = (name: string, path: Set<string>) => {
    if (done.has(name) || path.has(name)) return;
    path.add(name);
    for (const fk of tables[name].foreign_keys) if (fk.table !== name && tables[fk.table]) visit(fk.table, path);
    path.delete(name);
    done.add(name);
    order.push(name);
  };
  for (const name of names) visit(name, new Set());
  return order;
}

/* ---------------------------------------------------------------- REST */

const headers = () => ({
  apikey: env.serviceKey,
  Authorization: `Bearer ${env.serviceKey}`,
  "Content-Type": "application/json",
});

async function restFetch(path: string, init: RequestInit) {
  const response = await fetch(`${env.url}/rest/v1/${path}`, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string; code?: string };
    const error = new Error(body.message ?? `HTTP ${response.status}`) as Error & { code?: string };
    error.code = body.code;
    throw error;
  }
}

async function wipe(table: string, data: TableBackup) {
  // PostgREST يرفض DELETE بلا شرط: «المفتاح موجود» يشمل كل الصفوف
  const column = data.primary_key[0] ?? Object.keys(data.rows[0] ?? {})[0];
  if (!column) return;
  await restFetch(`${encodeURIComponent(table)}?${encodeURIComponent(column)}=not.is.null`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
}

async function write(table: string, data: TableBackup, mode: "merge" | "replace") {
  const conflict = mode === "merge" && data.primary_key.length ? `?on_conflict=${data.primary_key.join(",")}` : "";
  const prefer = mode === "merge" && data.primary_key.length ? "resolution=merge-duplicates,return=minimal" : "return=minimal";
  for (let i = 0; i < data.rows.length; i += 500) {
    const batch = data.rows.slice(i, i + 500);
    try {
      await restFetch(`${encodeURIComponent(table)}${conflict}`, { method: "POST", headers: { Prefer: prefer }, body: JSON.stringify(batch) });
    } catch (error) {
      // admins → auth.users: الحساب غير موجود في هذا المشروع
      if (table === "admins" && (error as { code?: string }).code === "23503") {
        console.warn(`  · admins: ${batch.length} صف لحسابات غير موجودة هنا — تجاوز (أنشئ الحساب بـ npm run admin:create)`);
        continue;
      }
      throw new Error(`${table}: ${(error as Error).message}`);
    }
  }
}

/* ---------------------------------------------------------------- التشغيل */

async function main() {
  if (flag("--list")) {
    const names = await kvList();
    console.log(names.length ? names.join("\n") : "(لا توجد نسخ)");
    return;
  }

  const kvKey = option("--kv");
  const file = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--kv" && args[i - 1] !== "--env");
  let text: string;
  if (kvKey) {
    const key = kvKey === "latest" ? (await kvList()).at(-1) : kvKey;
    if (!key) throw new Error("لا توجد نسخ في KV");
    console.log(`· النسخة من KV: ${key}`);
    text = await kvGet(key);
  } else if (file) {
    text = readFileSync(file, "utf8");
  } else {
    console.error("الاستعمال: npx tsx scripts/restore-backup.ts <backup.json | --kv latest | --kv KEY | --list> [--replace] [--env FILE] [--yes]");
    process.exit(1);
  }

  const backup = JSON.parse(text) as Backup;
  if (backup.format !== "armando-backup" || backup.version !== 1) throw new Error("الملف ليس نسخة احتياطية من armando-ops");
  const mode = flag("--replace") ? "replace" : "merge";
  const order = insertOrder(backup.tables);

  console.log(`· النسخة: ${backup.created_at} من ${backup.source}`);
  console.log(`· الهدف: ${new URL(env.url).host} · الطريقة: ${mode === "replace" ? "استبدال كامل (--replace)" : "دمج بالمفتاح الأساسي"}`);
  for (const name of order) console.log(`  ${name}: ${backup.tables[name].rows.length} صف`);
  if (!flag("--yes")) {
    console.log("\nلم يُكتب شيء. أعد التشغيل مع --yes للتنفيذ.");
    return;
  }

  if (mode === "replace") {
    // الأبناء أولاً (property_images قبل properties…)
    for (const name of [...order].reverse()) {
      await wipe(name, backup.tables[name]);
      console.log(`  ✓ تفريغ ${name}`);
    }
  }
  for (const name of order) {
    await write(name, backup.tables[name], mode);
    console.log(`  ✓ ${name}`);
  }
  console.log(`✓ تم الاسترجاع إلى ${new URL(env.url).host}`);
}

main().catch((error) => {
  console.error(`✗ ${(error as Error).message}`);
  process.exit(1);
});
