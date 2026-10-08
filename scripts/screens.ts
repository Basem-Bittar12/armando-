/**
 * لقطات شاشة لكل صفحة عامة وكل صفحة باللوحة على ثلاثة مقاسات (390x844، 390x664، 1440x900)
 * إلى docs/screens/final. يحتاج الموقع شغّالاً (BASE_URL، افتراضياً http://localhost:4173) وSupabase بـ .env.local.
 * ينشئ مسؤولاً مؤقتاً للدخول ثم يحذفه.
 * التشغيل: npx tsx scripts/screens.ts
 */
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "@playwright/test";
import { serviceClient } from "./env";

const base = process.env.BASE_URL ?? "http://localhost:4173";
const out = join(process.cwd(), "docs", "screens", "final");
mkdirSync(out, { recursive: true });

const SIZES = [
  { name: "390x844", width: 390, height: 844, mobile: true },
  { name: "390x664", width: 390, height: 664, mobile: true },
  { name: "1440x900", width: 1440, height: 900, mobile: false },
];
const PUBLIC = [
  ["home", "/"],
  ["properties", "/properties"],
  ["property", "/property/AK-102"],
  ["contact", "/contact"],
  ["not-found", "/no-such-page"],
  ["admin-login", "/admin"],
];
const ADMIN = [
  ["admin-properties", "/admin/properties"],
  ["admin-property-edit", "/admin/properties/new"],
  ["admin-home", "/admin/home"],
  ["admin-inquiries", "/admin/inquiries"],
  ["admin-options", "/admin/options"],
  ["admin-contact", "/admin/contact"],
  ["admin-more", "/admin/more"],
  ["admin-help", "/admin/help"],
];

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => !document.querySelector("[aria-busy='true']"), undefined, { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

const db = serviceClient();
const email = `screens-${Date.now()}@example.com`;
const password = randomBytes(18).toString("base64url");
const { data: created, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
if (error || !created.user) throw new Error(error?.message);
await db.from("admins").insert({ user_id: created.user.id });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  for (const size of SIZES) {
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: size.mobile ? 2 : 1,
      isMobile: size.mobile,
      hasTouch: size.mobile,
      locale: "ar-AE",
    });
    const page = await context.newPage();
    for (const [name, path] of PUBLIC) {
      await page.goto(base + path);
      await settle(page);
      await page.screenshot({ path: join(out, `${name}-${size.name}.png`) });
    }
    // الرئيسية: لقطة إضافية عند شريط «البيوت المتاحة»
    await page.goto(base + "/");
    await settle(page);
    await page.locator(".hstrip").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(out, `home-strip-${size.name}.png`) });

    await page.goto(base + "/admin");
    await page.getByLabel("الإيميل").fill(email);
    await page.getByLabel("كلمة السر").fill(password);
    await page.getByRole("button", { name: "دخول" }).click();
    await page.waitForURL(/\/admin\/properties$/);
    for (const [name, path] of ADMIN) {
      await page.goto(base + path);
      await settle(page);
      await page.screenshot({ path: join(out, `${name}-${size.name}.png`) });
    }
    await context.close();
    console.log(`✓ ${size.name}`);
  }
} finally {
  await browser.close();
  await db.auth.admin.deleteUser(created.user.id);
}
console.log(`✓ اللقطات في ${out}`);
