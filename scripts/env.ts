/**
 * قراءة .env.local للسكربتات المحلية فقط (لا يدخل الموقع).
 * service_role وكلمة سر القاعدة لا يخرجان من هذه السكربتات أبداً.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

config({ path: ".env.local" });

function need(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    console.error(`✗ القيمة ${key} فاضية في .env.local`);
    process.exit(1);
  }
  return value;
}

export const env = {
  get url() {
    return need("VITE_SUPABASE_URL").replace(/\/$/, "");
  },
  get anonKey() {
    return need("VITE_SUPABASE_ANON_KEY");
  },
  get serviceKey() {
    return need("SUPABASE_SERVICE_ROLE_KEY");
  },
  get dbPassword() {
    return need("SUPABASE_DB_PASSWORD");
  },
  get ref() {
    const match = /^https:\/\/([a-z0-9]+)\.supabase\.co/.exec(this.url);
    if (!match) {
      console.error("✗ VITE_SUPABASE_URL لازم يكون بالشكل https://xxxx.supabase.co");
      process.exit(1);
    }
    return match[1];
  },
};

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
export const anonClient = () => createClient(env.url, env.anonKey, noSession);
export const serviceClient = () => createClient(env.url, env.serviceKey, noSession);

/**
 * اتصال مباشر بقاعدة البيانات (للـmigrations). الاتصال المباشر بـSupabase المجاني IPv6 فقط،
 * فنجرّب الـpooler (Session mode، IPv4) على المناطق المعروفة حتى ينجح أحدها.
 */
const REGIONS = [
  "ap-south-1", "eu-central-1", "eu-central-2", "eu-west-1", "eu-west-2", "eu-west-3", "eu-north-1",
  "me-central-1", "me-south-1", "us-east-1", "us-east-2", "us-west-1", "us-west-2", "ca-central-1",
  "sa-east-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2",
];

export async function connectDb(): Promise<pg.Client> {
  // رابط مباشر (Supabase المحلي، أو connection string من لوحة Supabase) إن وُجد
  const direct = process.env.SUPABASE_DB_URL?.trim();
  if (direct) {
    const client = new pg.Client({ connectionString: direct });
    await client.connect();
    console.log("✓ متصل بالقاعدة عبر SUPABASE_DB_URL");
    return client;
  }
  const candidates = [
    { host: `db.${env.ref}.supabase.co`, user: "postgres" },
    ...["aws-0", "aws-1"].flatMap((prefix) =>
      REGIONS.map((region) => ({ host: `${prefix}-${region}.pooler.supabase.com`, user: `postgres.${env.ref}` })),
    ),
  ];
  for (const candidate of candidates) {
    const client = new pg.Client({
      ...candidate,
      port: 5432,
      database: "postgres",
      password: env.dbPassword,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 6000,
    });
    try {
      await client.connect();
      console.log(`✓ متصل بالقاعدة عبر ${candidate.host}`);
      return client;
    } catch (error) {
      const message = (error as Error).message;
      // كلمة سر خاطئة = المضيف صحيح، لا داعي لتجربة البقية
      if (/password authentication failed/i.test(message)) {
        console.error("✗ كلمة سر قاعدة البيانات غير صحيحة (SUPABASE_DB_PASSWORD)");
        process.exit(1);
      }
      await client.end().catch(() => {});
    }
  }
  console.error("✗ تعذّر الاتصال بالقاعدة على أي مضيف معروف");
  process.exit(1);
}
