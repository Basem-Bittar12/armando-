/**
 * تطبيق ملفات supabase/migrations بالترتيب، كل ملف مرة واحدة فقط (سجلّ في public._migrations).
 * التشغيل: npx tsx scripts/migrate.ts
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { connectDb } from "./env";

const dir = join(process.cwd(), "supabase", "migrations");
const client = await connectDb();

await client.query(`create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now())`);
// جدول داخلي: لا أحد يقرؤه عبر الـAPI
await client.query(`alter table public._migrations enable row level security`);
await client.query(`revoke all on public._migrations from anon, authenticated`);

const done = new Set((await client.query<{ name: string }>("select name from public._migrations")).rows.map((r) => r.name));
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  if (done.has(file)) {
    console.log(`· ${file} (مطبّق سابقاً)`);
    continue;
  }
  const sql = readFileSync(join(dir, file), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into public._migrations (name) values ($1)", [file]);
    await client.query("commit");
    console.log(`✓ ${file}`);
  } catch (error) {
    await client.query("rollback");
    console.error(`✗ ${file}: ${(error as Error).message}`);
    await client.end();
    process.exit(1);
  }
}
await client.end();
