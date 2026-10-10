/**
 * Cloudflare Worker «armando-ops» — يسد ثغرتين في خطة Supabase المجانية، بدون أي اشتراك:
 *
 * 1. منع الإيقاف بسبب الخمول: كل يوم قراءة صغيرة من جدول settings بالمفتاح العام (anon).
 *    (Supabase يوقف المشروع المجاني بعد أسبوع بلا نشاط.)
 * 2. نسخة احتياطية أسبوعية: كل جداول قاعدة البيانات كـ JSON بمفتاح service_role
 *    (سرّ في Worker فقط، لا يصل للمتصفح أبداً)، تُحفظ في Workers KV، ونحتفظ بآخر 8 نسخ.
 *
 * التشغيل اليدوي (للاختبار): POST /run?task=ping|backup مع Authorization: Bearer <OPS_TOKEN>.
 * بدون OPS_TOKEN صحيح يرد 404 — لا يكشف شيئاً.
 *
 * حد الخطة المجانية: 10ms وقت معالج لكل تشغيل. لذلك صفوف الجداول لا تُحلَّل (JSON.parse) إطلاقاً:
 * نص كل صفحة من PostgREST يُلصق كما هو داخل ملف النسخة.
 */

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { metadata?: unknown }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string }): Promise<{ keys: { name: string; metadata?: unknown }[]; list_complete: boolean; cursor?: string }>;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

export interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

export interface Env {
  BACKUPS: KVNamespace;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  /** سرّ (wrangler secret put) — لا يُكتب في wrangler.jsonc ولا في الكود */
  SUPABASE_SERVICE_ROLE_KEY: string;
  /** سرّ اختياري للتشغيل اليدوي عبر HTTP */
  OPS_TOKEN?: string;
  /** cron النسخة الأسبوعية (نفس القيمة الموجودة في triggers.crons) */
  BACKUP_CRON: string;
}

export const BACKUP_PREFIX = "backup:";
export const KEEP_BACKUPS = 8;
/** أقصى صفوف يرجعها Supabase بطلب واحد (max rows الافتراضي 1000) */
const PAGE_SIZE = 1000;

const base = (env: Env) => env.SUPABASE_URL.replace(/\/$/, "");

/* ---------------------------------------------------------------- منع الخمول */

export async function ping(env: Env) {
  const response = await fetch(`${base(env)}/rest/v1/settings?select=id&limit=1`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`ping failed: HTTP ${response.status} ${body.slice(0, 200)}`);
  return { status: response.status, body };
}

/* ---------------------------------------------------------------- النسخة الاحتياطية */

type ForeignKey = { column: string; table: string; references: string };
type TableInfo = { name: string; primaryKey: string[]; foreignKeys: ForeignKey[] };

type OpenApi = {
  paths: Record<string, Record<string, unknown>>;
  definitions: Record<string, { properties?: Record<string, { description?: string }> }>;
};

const serviceHeaders = (env: Env) => ({
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
});

/**
 * الجداول من وصف PostgREST نفسه (OpenAPI)، فأي جدول جديد يدخل النسخة تلقائياً.
 * الجدول = مسار يقبل POST (الـ views للقراءة فقط لا تقبله). المفتاح الأساسي والعلاقات من وصف الأعمدة.
 */
export function tablesFromOpenApi(spec: OpenApi): TableInfo[] {
  return Object.entries(spec.definitions)
    .filter(([name]) => spec.paths[`/${name}`]?.post)
    .map(([name, definition]) => {
      const primaryKey: string[] = [];
      const foreignKeys: ForeignKey[] = [];
      for (const [column, info] of Object.entries(definition.properties ?? {})) {
        const description = info.description ?? "";
        if (description.includes("<pk/>")) primaryKey.push(column);
        const fk = /<fk table='([^']+)' column='([^']+)'\/>/.exec(description);
        if (fk) foreignKeys.push({ column, table: fk[1], references: fk[2] });
      }
      return { name, primaryKey, foreignKeys };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function listTables(env: Env): Promise<TableInfo[]> {
  const response = await fetch(`${base(env)}/rest/v1/`, {
    headers: { ...serviceHeaders(env), Accept: "application/openapi+json" },
  });
  if (!response.ok) throw new Error(`openapi: HTTP ${response.status}`);
  return tablesFromOpenApi((await response.json()) as OpenApi);
}

/** صفوف جدول كنص JSON (مصفوفة)، صفحة بصفحة بترتيب المفتاح الأساسي — بلا تحليل */
async function exportRows(env: Env, table: TableInfo): Promise<{ json: string; count: number }> {
  const order = table.primaryKey.length ? `&order=${table.primaryKey.map((c) => `${c}.asc`).join(",")}` : "";
  const parts: string[] = [];
  let total = Infinity;
  for (let from = 0; from < total; from += PAGE_SIZE) {
    const response = await fetch(`${base(env)}/rest/v1/${encodeURIComponent(table.name)}?select=*${order}`, {
      headers: {
        ...serviceHeaders(env),
        Accept: "application/json",
        Prefer: "count=exact",
        "Range-Unit": "items",
        Range: `${from}-${from + PAGE_SIZE - 1}`,
      },
    });
    if (!response.ok && response.status !== 416) throw new Error(`${table.name}: HTTP ${response.status} ${(await response.text()).slice(0, 200)}`);
    // Content-Range: 0-999/2345 (أو */0 لجدول فارغ)
    total = Number(response.headers.get("content-range")?.split("/")[1] ?? 0) || 0;
    const text = (await response.text()).trim();
    const inner = text.replace(/^\[/, "").replace(/\]$/, "").trim();
    if (inner) parts.push(inner);
    if (response.status === 416) break;
  }
  return { json: `[${parts.join(",")}]`, count: Number.isFinite(total) ? total : 0 };
}

export async function backup(env: Env, now = new Date()) {
  const tables = await listTables(env);
  const sections: string[] = [];
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const { json, count } = await exportRows(env, table);
    counts[table.name] = count;
    const info = JSON.stringify({ primary_key: table.primaryKey, foreign_keys: table.foreignKeys });
    // {"primary_key":…,"foreign_keys":…,"rows":[…]}
    sections.push(`${JSON.stringify(table.name)}:${info.slice(0, -1)},"rows":${json}}`);
  }
  const createdAt = now.toISOString();
  const header = JSON.stringify({ format: "armando-backup", version: 1, created_at: createdAt, source: new URL(base(env)).host });
  const document = `${header.slice(0, -1)},"tables":{${sections.join(",")}}}`;
  const key = `${BACKUP_PREFIX}${createdAt.slice(0, 19).replace(/:/g, "-")}Z`;
  const metadata = { created_at: createdAt, bytes: new TextEncoder().encode(document).byteLength, tables: tables.length, rows: Object.values(counts).reduce((a, b) => a + b, 0) };
  await env.BACKUPS.put(key, document, { metadata });
  const deleted = await prune(env);
  return { key, ...metadata, counts, deleted };
}

/** نحتفظ بآخر KEEP_BACKUPS نسخ فقط (الأسماء فيها التاريخ، فالترتيب الأبجدي = الزمني) */
export async function prune(env: Env, keep = KEEP_BACKUPS) {
  const names: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.BACKUPS.list({ prefix: BACKUP_PREFIX, cursor });
    names.push(...page.keys.map((k) => k.name));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  const old = names.sort().reverse().slice(keep);
  for (const name of old) await env.BACKUPS.delete(name);
  return old;
}

