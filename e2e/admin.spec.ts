/**
 * لوحة التحكم من أولها لآخرها على Supabase المحلي: الحماية، الدخول، إضافة عقار بصور، عرضه بالرئيسية،
 * رؤيته بالموقع، ثم حذفه مع ملفات صوره.
 */
import { expect, test } from "@playwright/test";
import { join } from "node:path";
import { service, testAdmin, watchConsole } from "./support";

test.describe("لوحة التحكم", () => {
  // لو فشل اختبار بالنص ما يضل عقاره مؤثراً على باقي الاختبارات
  test.afterEach(async () => {
    const db = service();
    const { data } = await db.from("properties").select("id").like("code", "E2E-%");
    for (const row of data ?? []) {
      const { data: files } = await db.storage.from("property-images").list(row.id);
      if (files?.length) await db.storage.from("property-images").remove(files.map((file) => `${row.id}/${file.name}`));
      await db.from("properties").delete().eq("id", row.id);
    }
    const { data: areas } = await db.from("areas").select("id,cover_path").like("name_ar", "منطقة اختبار%");
    for (const area of areas ?? []) {
      if (area.cover_path) await db.storage.from("area-covers").remove([area.cover_path]);
      await db.from("areas").delete().eq("id", area.id);
    }
    await db.from("cities").delete().like("name_ar", "مدينة اختبار%");
  });

  test("كل مسارات /admin محمية بالدخول، والتسجيل العام غير موجود", async ({ page }) => {
    for (const path of ["/admin", "/admin/properties", "/admin/properties/new", "/admin/inquiries", "/admin/contact"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "لوحة المكتب" })).toBeVisible();
      await expect(page.getByLabel("كلمة السر")).toBeVisible();
      await expect(page.locator(".adm-item, .adm-form section")).toHaveCount(0);
    }
    await expect(page.getByText(/إنشاء حساب|تسجيل جديد/)).toHaveCount(0);
    await page.getByLabel("الإيميل").fill("nobody@example.com");
    await page.getByLabel("كلمة السر").fill("wrong-password-123");
    await page.getByRole("button", { name: "دخول" }).click();
    await expect(page.getByRole("alert")).toContainText("غير صحيحة");
  });

  test("دخول ← إضافة عقار بصور ← عرضه بالرئيسية ← يظهر بالموقع ← حذفه مع ملفاته", async ({ page, browserName }, testInfo) => {
    test.setTimeout(120_000);
    const errors = watchConsole(page);
    const admin = testAdmin();
    const code = `E2E-${testInfo.project.name.slice(0, 3).toUpperCase()}${Date.now() % 100000}`;
    const title = `شقة اختبار ${code}`;
    const db = service();

    // الدخول
    await page.goto("/admin");
    await page.getByLabel("الإيميل").fill(admin.email);
    await page.getByLabel("كلمة السر").fill(admin.password);
    await page.getByRole("button", { name: "دخول" }).click();
    await expect(page).toHaveURL(/\/admin\/properties$/);
    await expect(page.locator(".adm-item").first()).toBeVisible();

    // عقار جديد
    await page.getByRole("link", { name: "إضافة عقار" }).first().click();
    await expect(page).toHaveURL(/\/admin\/properties\/new$/);
    await page.getByLabel("اسم العقار").fill(title);
    await page.getByLabel("الكود").fill(code);
    await page.getByLabel("الوصف").fill("وصف قصير لعقار الاختبار.");
    await page.getByRole("radio", { name: "فيلا" }).click();
    await page.getByLabel("شهري").fill("12345");
    await page.getByRole("button", { name: "موقف سيارة" }).click();
    await page.getByTestId("image-input").setInputFiles([join("e2e", "fixtures", "room-a.webp"), join("e2e", "fixtures", "room-b.webp")]);
    await expect(page.locator(".adm-images__item")).toHaveCount(2, { timeout: 30_000 });
    await expect(page.locator(".adm-images__item").first()).toContainText("الغلاف");
    await page.getByRole("button", { name: "حفظ ونشر" }).click();
    await expect(page).toHaveURL(/\/admin\/properties$/, { timeout: 30_000 });

    // بالقاعدة: العقار وسعره ومرفقه وصورتان بثلاث نسخ WebP مرفوعة + JPEG للمشاركة
    const { data: saved } = await db
      .from("properties")
      .select("id,is_published,show_on_home,property_prices(amount),property_amenities(amenity_id),property_images(path_640,path_1080,path_1600,sort_order)")
      .eq("code", code)
      .single();
    expect(saved!.is_published).toBe(true);
    expect(saved!.property_prices).toEqual([{ amount: 12345 }]);
    expect(saved!.property_amenities).toHaveLength(1);
    expect(saved!.property_images).toHaveLength(2);
    const { data: files } = await db.storage.from("property-images").list(saved!.id);
    expect((files ?? []).map((file) => file.name).filter((name) => name.endsWith(".webp"))).toHaveLength(6);
    for (const file of files ?? []) expect(file.metadata?.mimetype).toBe(file.name.endsWith(".jpg") ? "image/jpeg" : "image/webp");
    // صورة مشاركة JPEG لكل صورة (معاينة واتساب)
    expect((files ?? []).filter((file) => file.name.endsWith("-og.jpg"))).toHaveLength(2);

    // عرضه بالرئيسية من القائمة
    const item = page.locator(".adm-item", { hasText: title });
    // المفتاح نفسه مخفي تحت شكله: نضغط على النص مثل المستخدم
    await item.locator("label.adm-toggle", { hasText: "اعرض بالرئيسية" }).click();
    await expect(item.getByRole("switch", { name: "اعرض بالرئيسية" })).toBeChecked();
    await expect(item).toContainText("بالرئيسية");
    await expect.poll(async () => (await db.from("properties").select("show_on_home").eq("id", saved!.id).single()).data?.show_on_home).toBe(true);

    // بالموقع العام: بشريط الرئيسية (آخر الترتيب) وبصفحته
    const site = await page.context().newPage();
    await site.goto("/");
    const stripTitles = site.locator(".hstrip__item .property-card__link");
    await expect(stripTitles.last()).toHaveText(title);
    await site.goto(`/property/${code}`);
    await expect(site.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(site.getByText("12,345").first()).toBeVisible();
    await site.close();

    // الحذف مع التأكيد: السطر والملفات
    await item.getByRole("button", { name: "حذف" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "حذف" }).click();
    await expect(page.locator(".adm-item", { hasText: title })).toHaveCount(0);
    await expect.poll(async () => (await db.from("properties").select("id").eq("code", code)).data?.length).toBe(0);
    await expect.poll(async () => (await db.storage.from("property-images").list(saved!.id)).data?.length ?? 0).toBe(0);

    // خروج
    if (browserName && testInfo.project.name.includes("iphone")) {
      await page.locator(".adm-tabs a", { hasText: "المزيد" }).click();
      await page.getByRole("button", { name: /خروج/ }).click();
    } else {
      await page.locator(".adm-side").getByRole("button", { name: "خروج" }).click();
    }
    await expect(page.getByLabel("كلمة السر")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("الخيارات: مدينة ومنطقة بصورة غلاف، إيقاف، والمدينة المستعملة ما بتنحذف", async ({ page }) => {
    test.setTimeout(90_000);
    const errors = watchConsole(page);
    const admin = testAdmin();
    const db = service();
    const stamp = Date.now() % 100000;
    const city = `مدينة اختبار ${stamp}`;
    const area = `منطقة اختبار ${stamp}`;

    await page.goto("/admin/options");
    await page.getByLabel("الإيميل").fill(admin.email);
    await page.getByLabel("كلمة السر").fill(admin.password);
    await page.getByRole("button", { name: "دخول" }).click();
    await expect(page).toHaveURL(/\/admin\/options$/);

    // مدينة جديدة
    await page.getByRole("button", { name: "إضافة مدينة" }).click();
    await page.getByLabel("الاسم بالعربي").fill(city);
    await page.getByRole("button", { name: "حفظ", exact: true }).click();
    await expect(page.locator(".adm-option", { hasText: city })).toBeVisible();

    // منطقة تابعة لها
    await page.getByRole("tab", { name: /المناطق/ }).click();
    await page.getByRole("button", { name: "إضافة منطقة" }).click();
    await page.getByLabel("الاسم بالعربي").fill(area);
    await page.getByRole("radio", { name: city }).click();
    await page.getByRole("button", { name: "حفظ", exact: true }).click();
    const areaRow = page.locator(".adm-option", { hasText: area });
    await expect(areaRow).toBeVisible();

    // صورة الغلاف
    await areaRow.getByRole("button", { name: `تعديل ${area}` }).click();
    await page.locator(".adm-cover input[type=file]").setInputFiles(join("e2e", "fixtures", "room-a.webp"));
    await expect(page.locator(".adm-cover img")).toBeVisible({ timeout: 30_000 });
    const { data: saved } = await db.from("areas").select("id,cover_path,city_id,cities(name_ar)").eq("name_ar", area).single();
    expect(saved!.cover_path).toMatch(/\.webp$/);
    expect((saved as unknown as { cities: { name_ar: string } }).cities.name_ar).toBe(city);
    await page.getByRole("button", { name: "إلغاء" }).click();

    // إيقاف المنطقة: تختفي من القراءة العامة
    await areaRow.locator("label.adm-toggle").click();
    await expect(areaRow).toContainText("موقوف");
    await expect.poll(async () => (await db.from("areas").select("is_active").eq("id", saved!.id).single()).data?.is_active).toBe(false);

    // المدينة صارت مستعملة (عليها منطقة): زر الحذف معطّل
    await page.getByRole("tab", { name: /المدن/ }).click();
    await expect(page.locator(".adm-option", { hasText: city }).getByRole("button", { name: /مستعمل/ })).toBeDisabled();
    expect(errors).toEqual([]);
  });
});
