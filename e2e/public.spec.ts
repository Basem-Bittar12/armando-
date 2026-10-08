/**
 * الموقع العام على بيانات Supabase الحقيقية (المحلية): الرئيسية، الشريط ← المعرض، الفلترة، صفحة العقار،
 * رابط واتساب، نموذج التواصل.
 */
import { expect, test } from "@playwright/test";
import { service, watchConsole } from "./support";

test.describe("الموقع العام", () => {
  test("الرئيسية: الهيرو يبدأ من أول القصة، والشريط يعرض المميّز بترتيبه وبدون أخطاء", async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto("/");
    // قصة الهيرو: الكانفس موجود والصفحة تبدأ من الأعلى
    await expect(page.locator("canvas").first()).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    // الشريط: المنشور + بالرئيسية + غير المؤجّر، بترتيب home_order وبحد home_count
    const db = service();
    const [{ data: settings }, { data: rows }] = await Promise.all([
      db.from("settings").select("home_count").eq("id", 1).single(),
      db.from("properties").select("title,home_order").eq("is_published", true).eq("show_on_home", true).neq("status", "مؤجر").order("home_order"),
    ]);
    const expected = (rows ?? []).slice(0, settings!.home_count).map((row) => row.title);
    const strip = page.locator(".hstrip__item .property-card__link");
    await expect(strip).toHaveCount(expected.length);
    expect(await strip.allTextContents()).toEqual(expected);
    // صور الشريط من Supabase Storage وبـ srcset
    const firstImage = page.locator(".hstrip__item img").first();
    await expect(firstImage).toHaveAttribute("src", /\/storage\/v1\/object\/public\/property-images\/.+-1080\.webp/);
    await expect(firstImage).toHaveAttribute("srcset", /-640\.webp 640w.*-1600\.webp 1600w/);
    expect(errors).toEqual([]);
  });

  test("الشريط يفتح صفحة العقار ومعرض الصور", async ({ page, isMobile }) => {
    const errors = watchConsole(page);
    await page.goto("/");
    const first = page.locator(".hstrip__item .property-card__link").first();
    const title = (await first.textContent())!.trim();
    await first.scrollIntoViewIfNeeded();
    await first.click();
    await expect(page).toHaveURL(/\/property\/[A-Z0-9-]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);

    if (isMobile) await page.getByRole("button", { name: "تكبير الصورة 1" }).click();
    else await page.locator(".detail-gallery__main").click();
    const lightbox = page.getByRole("dialog");
    await expect(lightbox).toBeVisible();
    await expect(lightbox.locator(".lightbox__count")).toContainText("1");
    await lightbox.getByRole("button", { name: "إغلاق" }).click();
    await expect(lightbox).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("الفلترة: الخيارات من البيانات، والنتيجة والرابط يتغيّران", async ({ page }) => {
    const errors = watchConsole(page);
    // الأعداد المتوقعة من القاعدة نفسها
    const db = service();
    const [{ data: props }, { data: terms }, { data: types }] = await Promise.all([
      db.from("properties").select("type_id,property_prices(rental_term_id)").eq("is_published", true),
      db.from("rental_terms").select("id,name_ar"),
      db.from("property_types").select("id,name_ar"),
    ]);
    const monthly = terms!.find((t) => t.name_ar === "شهري")!.id;
    const villa = types!.find((t) => t.name_ar === "فيلا")!.id;
    const total = props!.length;
    const monthlyCount = props!.filter((p) => p.property_prices.some((price) => price.rental_term_id === monthly)).length;
    const villaCount = props!.filter((p) => p.type_id === villa).length;
    const shown = page.locator(".result-meta strong");

    await page.goto("/properties");
    await expect(shown).toHaveText(String(total));
    await expect(page.locator(".property-card")).toHaveCount(total);
    await page.locator(".filter-pills button", { hasText: "شهري" }).click();
    await expect(page).toHaveURL(/term=/);
    await expect(shown).toHaveText(String(monthlyCount));
    await page.locator(".filter-pills button", { hasText: "شهري" }).click();
    await expect(shown).toHaveText(String(total));
    await page.locator(".filter-toggle").click();
    await page.locator(".filter-drawer .choice-chips button", { hasText: "فيلا" }).click();
    await expect(page.locator(".filter-drawer__apply")).toContainText(String(villaCount));
    await page.locator(".filter-drawer__apply").click();
    await expect(page).toHaveURL(/type=/);
    await expect(page.locator(".property-card")).toHaveCount(villaCount);
    expect(errors).toEqual([]);
  });

  test("صفحة العقار ورابط واتساب برسالة فيها الاسم والكود والرابط", async ({ page }) => {
    const errors = watchConsole(page);
    const { data: settings } = await service().from("settings").select("whatsapp").eq("id", 1).single();
    await page.goto("/property/AK-102");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const link = page.locator("a.whatsapp-button").first();
    const href = (await link.getAttribute("href"))!;
    expect(href).toMatch(new RegExp(`^https://wa\\.me/${settings!.whatsapp}\\?text=`));
    const message = decodeURIComponent(href.split("?text=")[1]);
    expect(message).toContain("AK-102");
    expect(message).toContain("/property/AK-102");
    // نافذة جديدة وآمنة
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noreferrer/);
    expect(errors).toEqual([]);
  });

  test("نموذج التواصل: يتحقق، يحفظ الطلب بالقاعدة، والفخ يمنع السبام", async ({ page }) => {
    const errors = watchConsole(page);
    const marker = `e2e:${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    await page.goto("/contact");
    await page.getByRole("button", { name: "أرسل الطلب" }).click();
    await expect(page.getByText("الرجاء كتابة الاسم الكامل")).toBeVisible();

    await page.getByLabel(/الاسم الكامل/).fill("زائر الاختبار");
    await page.getByLabel(/رقم الهاتف/).fill("+971 50 000 0000");
    await page.getByLabel("رسالتك").fill(marker);
    await page.getByRole("button", { name: "أرسل الطلب" }).click();
    await expect(page.getByText("وصلنا طلبك")).toBeVisible();

    const { data: saved } = await service().from("inquiries").select("name,phone,status").eq("message", marker);
    expect(saved).toEqual([{ name: "زائر الاختبار", phone: "+971 50 000 0000", status: "جديد" }]);

    // روبوت يعبّي الحقل المخفي: الواجهة تُظهر نجاحاً ولا شيء ينحفظ (والقاعدة ترفضه لو أُرسل مباشرة — check-rls)
    await page.getByRole("button", { name: "إرسال طلب آخر" }).click();
    await page.getByLabel(/الاسم الكامل/).fill("روبوت");
    await page.getByLabel(/رقم الهاتف/).fill("+971 50 111 1111");
    await page.getByLabel("رسالتك").fill(`${marker}-spam`);
    await page.locator("input[name='website']").fill("http://spam.example", { force: true });
    await page.getByRole("button", { name: "أرسل الطلب" }).click();
    await expect(page.getByText("وصلنا طلبك")).toBeVisible();
    const { data: spam } = await service().from("inquiries").select("id").eq("message", `${marker}-spam`);
    expect(spam).toEqual([]);
    expect(errors).toEqual([]);
  });
});
