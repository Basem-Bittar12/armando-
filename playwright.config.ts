/**
 * اختبارات e2e على نسخة الإنتاج (vite build + preview) مربوطة بـ Supabase المحلي (.env.local).
 * Chromium: من المتصفح المثبّت بالجهاز (CHROMIUM_PATH) أو متصفح Playwright العادي.
 * WebKit (آيفون): npm run test:e2e:webkit — يشتغل داخل حاوية Playwright الرسمية لأن WebKit يحتاج مكتبات نظام.
 */
import { defineConfig, devices } from "@playwright/test";

const chromiumPath = process.env.CHROMIUM_PATH || undefined;
const port = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: "e2e",
  // التدقيق (audit.spec.ts) يشتغل لحاله: npm run test:audit
  testIgnore: process.env.E2E_AUDIT ? [] : ["**/audit.spec.ts"],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  // اختبار اللوحة يعدّل بيانات مشتركة (حد الرئيسية): تشغيل متتالٍ أضمن
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/e2e-last-run.json" }]],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "ar-AE",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, launchOptions: { executablePath: chromiumPath } },
    },
    {
      name: "chromium-iphone",
      use: { ...devices["iPhone 13"], browserName: "chromium", launchOptions: { executablePath: chromiumPath } },
    },
    {
      name: "webkit-iphone",
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        // خادم Express الخاص بالمشروع (server/index.ts) بدل vite preview: vite preview يرسل 304 بلا
        // Vary: Accept-Encoding فيعرض WebKit صفحة مضغوطة كنص
        command: `npx vite build && PORT=${port} npx tsx server/index.ts`,
        url: `http://localhost:${port}`,
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
