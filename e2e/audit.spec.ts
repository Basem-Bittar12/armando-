/**
 * تدقيق الجودة على كل صفحة عامة وكل صفحة باللوحة:
 *  - axe: لا مخالفات «serious» أو «critical» (التباين ضمنها)
 *  - لا سكرول أفقي على عروض التلفون 360–430
 *  - كل لون ظاهر من الباليت الرسمية (أو شفافيتها)
 *  - لا أخطاء بالكونسول
 * يشتغل على chromium-desktop فقط (npm run test:audit).
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { testAdmin, watchConsole } from "./support";

const PUBLIC = ["/", "/properties", "/property/AK-102", "/property/AK-087", "/contact", "/no-such-page", "/admin"];
const ADMIN = [
  "/admin/properties",
  "/admin/properties/new",
  "/admin/home",
  "/admin/inquiries",
  "/admin/options",
  "/admin/contact",
  "/admin/more",
  "/admin/help",
];

/** الباليت الرسمية (client/src/index.css) */
const PALETTE: Record<string, [number, number, number]> = {
  almond: [239, 226, 208],
  "espresso-deep": [47, 34, 26],
  espresso: [59, 42, 32],
  date: [122, 74, 50],
  sandstone: [216, 195, 165],
  terracotta: [181, 105, 74],
  taupe: [142, 122, 104],
};

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  // انتظار ظهور المحتوى بعد هياكل التحميل
  await page.waitForFunction(() => !document.querySelector("[aria-busy='true']"), undefined, { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function axe(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return result.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.impact} ${v.id}: ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
}

/** ألوان كل العناصر الظاهرة؛ يعيد ما ليس من الباليت */
async function offPalette(page: Page) {
  const found = await page.evaluate(() => {
    const out: { color: string; where: string }[] = [];
    const props = ["color", "background-color", "border-top-color", "border-bottom-color", "outline-color", "fill", "stroke"] as const;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      for (const prop of props) {
        const value = style.getPropertyValue(prop);
        if (!value || value === "none" || value.startsWith("url(")) continue;
        if (prop.startsWith("border") && parseFloat(style.getPropertyValue(prop.replace("color", "width"))) === 0) continue;
        if (prop === "outline-color" && style.outlineStyle === "none") continue;
        // fill/stroke خاصية SVG فقط (قيمتها الافتراضية بعناصر HTML سوداء وغير مرسومة)
        if ((prop === "fill" || prop === "stroke") && !(el instanceof SVGElement)) continue;
        out.push({ color: value, where: `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]} ${prop}` });
      }
    }
    return out;
  });
  const bad = new Map<string, string>();
  for (const { color, where } of found) {
    const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(color);
    if (!m) continue;
    const [r, g, b, a = "1"] = m.slice(1);
    if (Number(a) === 0) continue;
    const match = Object.values(PALETTE).some(([pr, pg, pb]) => Math.abs(pr - +r) <= 2 && Math.abs(pg - +g) <= 2 && Math.abs(pb - +b) <= 2);
    if (!match && !bad.has(color)) bad.set(color, where);
  }
  return [...bad].map(([color, where]) => `${color} @ ${where}`);
}

async function noOverflow(page: Page) {
  const problems: string[] = [];
  for (const width of [360, 375, 390, 414, 430]) {
    await page.setViewportSize({ width, height: 800 });
    await page.waitForTimeout(250);
    const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    if (scroll > client + 1) problems.push(`${width}px: scrollWidth ${scroll} > ${client}`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  return problems;
}

async function audit(page: Page, path: string, errors: string[]) {
  // الكونسول قبل تجربة العروض: تصغير صفحة فُتحت بمقاس لابتوب لعرض تلفون يطلق تحذير قياس الهيرو (غير واقعي)
  const consoleErrors = [...errors];
  const report = { path, axe: await axe(page), palette: await offPalette(page), overflow: await noOverflow(page), console: consoleErrors };
  test.info().annotations.push({ type: "audit", description: JSON.stringify(report) });
  return report;
}

test.describe("تدقيق الجودة", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "مرة واحدة على chromium-desktop");
  });
  test.describe.configure({ mode: "default" });

  for (const path of PUBLIC) {
    test(`الموقع العام ${path}`, async ({ page }) => {
      const errors = watchConsole(page);
      await page.goto(path);
      await settle(page);
      const report = await audit(page, path, errors);
      expect(report.axe, "axe serious/critical").toEqual([]);
      expect(report.overflow, "سكرول أفقي").toEqual([]);
      expect(report.palette, "ألوان خارج الباليت").toEqual([]);
      expect(report.console, "أخطاء الكونسول").toEqual([]);
    });
  }

  test("صفحات اللوحة", async ({ page }) => {
    test.setTimeout(180_000);
    const errors = watchConsole(page);
    const admin = testAdmin();
    await page.goto("/admin");
    await page.getByLabel("الإيميل").fill(admin.email);
    await page.getByLabel("كلمة السر").fill(admin.password);
    await page.getByRole("button", { name: "دخول" }).click();
    await expect(page).toHaveURL(/\/admin\/properties$/);
    const failures: string[] = [];
    for (const path of ADMIN) {
      await page.goto(path);
      await settle(page);
      const report = await audit(page, path, errors.splice(0));
      for (const [kind, list] of Object.entries(report)) {
        if (kind !== "path" && (list as string[]).length) failures.push(`${path} ${kind}: ${(list as string[]).join(" ; ")}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
