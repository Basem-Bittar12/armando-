/** أدوات مشتركة للاختبارات: عميل service_role من .env.local (للتجهيز والتنظيف فقط، لا يدخل المتصفح) */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import type { Page } from "@playwright/test";

config({ path: ".env.local", quiet: true });

export const supabaseUrl = process.env.VITE_SUPABASE_URL!;
export const service = () =>
  createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

export const ADMIN_FILE = join("e2e", ".admin.json");
export const testAdmin = () => JSON.parse(readFileSync(ADMIN_FILE, "utf8")) as { id: string; email: string; password: string };

/** يجمع أخطاء الكونسول ويتجاهل ما ليس من الموقع (خطوط Google خارج الشبكة مثلاً) */
export function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    // خطوط Google (المورد الخارجي الوحيد) قد تُحجب أو يمرّ اتصالها عبر بروكسي بشهادة لا يثق بها WebKit داخل حاوية الاختبار
    if (/fonts\.(googleapis|gstatic)\.com|ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|net::ERR_FAILED|status of 403|Unacceptable TLS certificate/.test(text)) return;
    errors.push(text);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}
