/* @vitest-environment jsdom */
/**
 * فحص دخاني (smoke test) مؤقت: يفتح كل صفحة ويشغّل كل تفاعل رئيسي
 * للتأكد من عدم وجود روابط ميتة أو أزرار بلا رد فعل.
 */
import { afterEach, describe, expect, it } from "vitest";
import "./setup";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "../App";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function go(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

async function mount(path: string) {
  go(path);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<App />);
  });
  return container;
}

function text() {
  return container?.textContent ?? "";
}

function byText(selector: string, needle: string) {
  return Array.from(container!.querySelectorAll(selector)).find((element) =>
    (element.textContent ?? "").includes(needle),
  ) as HTMLElement | undefined;
}

async function click(element: Element | undefined | null) {
  expect(element, "العنصر غير موجود").toBeTruthy();
  await act(async () => {
    (element as HTMLElement).click();
  });
}

async function navigate(path: string) {
  await act(async () => {
    go(path);
  });
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("صفحات الموقع العام", () => {
  it("الصفحة الرئيسية تعرض الأقسام والعقارات المميزة", async () => {
    await mount("/");
    expect(text()).toContain("كلّ بيتٍ يبدأ فارغًا.");
    expect(text()).toContain("تصفّح البيوت");
    // الرئيسية: لا مربع بحث، وقسم «اختيارات تستحق الانتباه»: 4 كروت عقارات في صف أفقي + زر «عرض كل البيوت»
    expect(container!.querySelector(".search-panel")).toBeNull();
    expect(text()).toContain("اختيارات تستحق الانتباه");
    expect(container!.querySelectorAll(".hstrip .property-card").length).toBe(4);
    expect(container!.querySelector(".hstrip__cta a")?.getAttribute("href")).toBe("/properties");
    // لا فقاعة واتساب عائمة، ولا كود عقار على الكروت
    expect(container!.querySelector(".floating-whatsapp")).toBeNull();
    expect(container!.querySelector(".property-card__id")).toBeNull();
    expect(text()).toContain("شقة بانورامية بإطلالة على المدينة");
    expect(text()).toContain("اكتشف");
    expect(document.title).toContain("أرماندو القاضي لبيوت العطلات");
    // الهوية الرسمية: لا رابط للوحة المكتب في الموقع العام، لا شارة "متاح"، لا روابط وهمية
    expect(container!.querySelector('a[href="/admin"]')).toBeNull();
    expect(container!.querySelectorAll(".property-card .chip").length).toBe(
      Array.from(container!.querySelectorAll(".property-card .chip")).filter((chip) => chip.textContent !== "متاح").length,
    );
    expect(text()).not.toContain("Privacy");
    expect(container!.querySelector('a[href^="mailto:"]')).toBeNull();
    // لا توجد صور مكسورة المسار
    const images = Array.from(container!.querySelectorAll("img"));
    expect(images.length).toBeGreaterThan(0);
    images.forEach((img) => {
      expect(img.getAttribute("src")).toBeTruthy();
      expect(img.getAttribute("src")).not.toContain("manus-storage");
    });
  });

  it("كل الروابط والأزرار لها وجهة أو معالج", async () => {
    for (const path of ["/", "/properties", "/property/AK-102", "/contact", "/admin"]) {
      await mount(path);
      const links = Array.from(container!.querySelectorAll("a"));
      const dead = links.filter((link) => {
        const href = link.getAttribute("href") ?? "";
        return !href || href === "#";
      });
      expect(dead.map((l) => l.textContent), `روابط ميتة في ${path}`).toEqual([]);
      act(() => root?.unmount());
      container?.remove();
    }
  });

  it("صفحة العقارات: البحث والفلاتر والترتيب تعمل وتنعكس على الرابط", async () => {
    await mount("/properties");
    // العدّ صادق: 6 عقارات منها 4 متاحة (واحد محجوز وواحد مؤجَّر)
    expect(text()).toContain("6 عقارات · 4 متاحة");

    // فلتر: إيجار شهري
    await click(byText(".filter-pills button", "شهري"));
    expect(window.location.search).toContain("term=");
    expect(text()).toContain("3 عقارات متاحة");

    // إزالة الفلتر: الضغط على نفس الزر مرة ثانية
    await click(byText(".filter-pills button", "شهري"));
    expect(text()).toContain("6 عقارات · 4 متاحة");

    // لوحة الفلترة: زر «فلترة» ثم زر ثابت بالعدد الحقيقي
    await click(container!.querySelector(".filter-toggle"));
    expect(container!.querySelector(".filter-drawer")).toBeTruthy();
    // المدينة أزرار داخل اللوحة (لا قوائم نظام تطلع خارج الشاشة)
    expect(container!.querySelector(".filter-drawer select")).toBeNull();
    await click(byText(".filter-drawer .choice-chips button", "الشارقة"));
    expect(text()).toContain("2 عقارات · 1 متاح");
    expect(container!.querySelector(".filter-drawer__apply")?.textContent).toContain("عرض 2 عقارات");

    // الترتيب
    await click(container!.querySelector(".sort-menu__button"));
    await click(byText(".sort-menu__list button", "السعر: من الأقل"));
    expect(container!.querySelector(".sort-menu__list")).toBeNull();
    expect(window.location.search).toContain("sort=priceAsc");
  });

  it("السعر لا يخلط الشهري بالسنوي: الترتيب بالمجموعات وفلتر السعر يحتاج نوع إيجار", async () => {
    await mount("/properties?sort=priceAsc");
    const prices = () =>
      Array.from(container!.querySelectorAll(".property-card__price")).map((p) => p.textContent!.replace(/\s+/g, " "));
    // المتاح والمحجوز: الشهري تصاعدياً ثم السنوي تصاعدياً، والمؤجَّر آخراً
    expect(prices()).toEqual([
      "4,900 درهم / شهري",
      "5,200 درهم / شهري",
      "8,500 درهم / شهري",
      "92,000 درهم / سنوي",
      "185,000 درهم / سنوي",
      "68,000 درهم / سنوي",
    ]);
    // رابط فيه سعر بلا نوع إيجار: السعر يُتجاهل، وحقلاه معطّلان مع شرح
    await navigate("/properties?min=50000");
    expect(container!.querySelectorAll(".property-card").length).toBe(6);
    await click(container!.querySelector(".filter-toggle"));
    const priceInput = container!.querySelector(".filter-drawer__grid input[type=number]") as HTMLInputElement;
    expect(priceInput.disabled).toBe(true);
    expect(text()).toContain("اختر شهري أو سنوي أولاً");
    // مع «سنوي»: الفلتر يعمل
    await navigate("/properties?term=%D8%B3%D9%86%D9%88%D9%8A&min=90000");
    expect(container!.querySelectorAll(".property-card").length).toBe(2);
  });

  it("زر «بحث» يفتح اللوحة والمؤشر داخل حقل البحث", async () => {
    await mount("/properties");
    await click(byText(".filter-pills button", "بحث"));
    expect(document.activeElement?.getAttribute("aria-label")).toBe("بحث في العقارات");
  });

  it("رابط الفلتر قابل للمشاركة مباشرة", async () => {
    await mount("/properties?term=%D8%B3%D9%86%D9%88%D9%8A");
    expect(text()).toContain("3 عقارات · 1 متاح");
  });

  it("الحالة الفارغة تظهر عند عدم وجود نتائج", async () => {
    await mount("/properties?q=xyzxyz");
    expect(text()).toContain("لا توجد نتائج مطابقة");
    await click(byText(".empty-state__actions button", "إزالة كل الفلاتر"));
    expect(text()).toContain("6 عقارات · 4 متاحة");
  });

  it("المفضلة: الإضافة من البطاقة تظهر في صفحة المفضلة", async () => {
    await mount("/properties");
    await click(container!.querySelector(".property-card__heart"));
    expect(container!.querySelector(".header-fav b")?.textContent).toBe("1");
    // المفضلة صارت من قائمة الموبايل / أيقونة الهيدر: نفس الرابط ?fav=1
    await navigate("/properties?fav=1");
    expect(text()).toContain("1 عقار متاح");
    // إرسال المفضلة على واتساب: الرسالة فيها البيت بالاسم والكود
    const share = container!.querySelector(".favorites-share a") as HTMLAnchorElement;
    expect(share.textContent).toContain("أرسل مفضلتي عبر واتساب");
    expect(decodeURIComponent(share.href)).toMatch(/هذه البيوت التي أعجبتني[\s\S]*\(AK-\d+\)/);
  });

  it("صفحة العقار: المعرض والمرافق والعقارات المشابهة", async () => {
    await mount("/property/AK-087");
    expect(text()).toContain("فيلا خاصة بتصميم معاصر");
    expect(text()).toContain("المرافق والمميزات");
    expect(text()).toContain("تفاصيل العقار");
    expect(text()).toContain("عقارات");
    expect(container!.querySelectorAll(".gallery-thumbs button").length).toBe(4);

    // تبديل صورة المعرض
    const thumbs = container!.querySelectorAll(".gallery-thumbs button");
    await click(thumbs[2]);
    expect(container!.querySelector(".gallery-thumbs button.is-active")).toBe(thumbs[2]);

    // فتح العارض وإغلاقه
    await click(container!.querySelector(".detail-gallery__main"));
    expect(container!.querySelector(".lightbox")).toBeTruthy();
    await click(container!.querySelector(".lightbox__close"));
    expect(container!.querySelector(".lightbox")).toBeFalsy();

    // عنوان الصفحة يتغير حسب العقار (تحضير SEO)
    expect(document.title).toContain("AK-087");
  });

  it("كود عقار غير موجود يعرض رسالة واضحة بدل صفحة فارغة", async () => {
    await mount("/property/AK-999");
    expect(text()).toContain("لم نعثر على العقار AK-999");
  });

  it("مسار غير معروف يعرض صفحة 404 بهوية الموقع", async () => {
    await mount("/something-else");
    expect(text()).toContain("غير موجودة");
    expect(text()).toContain("العودة إلى الرئيسية");
  });

  it("نموذج التواصل يتحقق من الحقول ثم يفتح واتساب بالرسالة", async () => {
    const opened: string[] = [];
    const originalOpen = window.open;
    window.open = ((url: string) => {
      opened.push(url);
      return null;
    }) as typeof window.open;
    await mount("/contact");
    // لا اختيار مسبق عن الزائر
    const selects = Array.from(container!.querySelectorAll<HTMLSelectElement>(".contact-form select"));
    expect(selects.map((s) => s.value)).toEqual(["", ""]);
    const form = container!.querySelector(".contact-form") as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(text()).toContain("الرجاء كتابة الاسم الكامل");
    // المؤشر على أول حقل خاطئ
    expect(document.activeElement).toBe(container!.querySelectorAll(".contact-form input")[0]);

    const inputs = container!.querySelectorAll(".contact-form input");
    await act(async () => {
      const setValue = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )!.set!;
      setValue.call(inputs[0], "باسم الكادي");
      inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
      setValue.call(inputs[1], "+971500000000");
      inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      (container!.querySelector(".contact-form") as HTMLFormElement).dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    expect(text()).toContain("رسالتك جاهزة على واتساب");
    expect(opened.length).toBe(1);
    const sentText = decodeURIComponent(opened[0]);
    expect(sentText).toContain("الاسم: باسم الكادي");
    expect(sentText).toContain("+971500000000");
    expect(sentText).not.toContain("نوع الإيجار");
    window.open = originalOpen;
  });
});

describe("لوحة المكتب", () => {
  it("النظرة العامة تعرض الإحصائيات الحقيقية من الحالة", async () => {
    await mount("/admin");
    expect(text()).toContain("صباح الخير");
    expect(byText(".stat-card", "إجمالي العقارات")?.textContent).toContain("6");
    expect(text()).toContain("آخر التحديثات");
  });

  it("التنقل بين صفحات اللوحة يعمل بروابط حقيقية", async () => {
    await mount("/admin");
    await navigate("/admin/properties");
    expect(text()).toContain("كل العقارات");
    await navigate("/admin/inquiries");
    expect(text()).toContain("الاستفسارات");
    await navigate("/admin/media");
    expect(text()).toContain("مكتبة الصور");
    await navigate("/admin/settings");
    expect(text()).toContain("إعدادات الموقع");
    await navigate("/admin/users");
    expect(text()).toContain("المستخدمون");
    // الصفحات خارج النطاق موسومة "قريباً" وليست معطّلة
    expect(container!.querySelector(".scope-notice")).toBeTruthy();
  });

  it("إضافة عقار من اللوحة تنشره في الموقع العام", async () => {
    await mount("/admin/properties");
    await click(byText(".properties-admin-heading button", "إضافة عقار"));
    expect(container!.querySelector(".add-modal")).toBeTruthy();

    // الحفظ بدون بيانات يُظهر أخطاء التحقق
    await click(byText(".modal-footer button", "حفظ ونشر"));
    expect(text()).toContain("اكتب اسماً واضحاً للعقار");

    const setValue = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!;
    const inputs = Array.from(container!.querySelectorAll(".modal-form-grid input"));
    const fill = async (index: number, value: string) => {
      await act(async () => {
        setValue.call(inputs[index], value);
        inputs[index].dispatchEvent(new Event("input", { bubbles: true }));
      });
    };
    await fill(0, "شقة تجريبية للفحص");
    await fill(2, "7500");
    await fill(3, "الجميرا، دبي");
    await fill(6, "1,100 قدم²");

    await click(byText(".modal-footer button", "حفظ ونشر"));
    expect(container!.querySelector(".add-modal")).toBeFalsy();
    expect(text()).toContain("شقة تجريبية للفحص");

    // العقار الجديد يظهر في الموقع العام
    await navigate("/properties");
    expect(text()).toContain("شقة تجريبية للفحص");
    expect(text()).toContain("7 عقارات · 5 متاحة");
  });

  it("تغيير حالة عقار وحذفه يعملان مع تأكيد", async () => {
    await mount("/admin/properties");
    const statusSelect = container!.querySelector(".status-select select") as HTMLSelectElement;
    await act(async () => {
      statusSelect.value = "مؤجر";
      statusSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect((container!.querySelector(".status-select select") as HTMLSelectElement).value).toBe("مؤجر");

    // قائمة الإجراءات → حذف → نافذة تأكيد
    await click(container!.querySelector(".table-actions .icon-button"));
    await click(byText(".row-menu button", "حذف العقار"));
    expect(container!.querySelector(".confirm-dialog")).toBeTruthy();
    await click(byText(".confirm-dialog .modal-footer button", "حذف"));
    expect(container!.querySelector(".confirm-dialog")).toBeFalsy();
    expect(text()).toContain("PROPERTY COLLECTION / 5");
  });

  it("الاستفسارات: الاختيار وتغيير الحالة يعملان", async () => {
    await mount("/admin/inquiries");
    expect(text()).toContain("خالد المنصوري");
    const rows = container!.querySelectorAll(".inquiry-row");
    await click(rows[1]);
    expect(container!.querySelector(".inquiry-detail")?.textContent).toContain("Sara Haddad");
    await click(byText(".inquiry-actions button", "تمت المتابعة"));
    expect(container!.querySelector(".inquiry-detail")?.textContent).toContain("تمت المتابعة");
  });

  it("نموذج التواصل يصل إلى استفسارات اللوحة", async () => {
    await mount("/contact");
    const setValue = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!;
    const inputs = container!.querySelectorAll(".contact-form input");
    await act(async () => {
      setValue.call(inputs[0], "عميل الفحص");
      inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
      setValue.call(inputs[1], "+971501112233");
      inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      (container!.querySelector(".contact-form") as HTMLFormElement).dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    await navigate("/admin/inquiries");
    expect(text()).toContain("عميل الفحص");
  });
});

describe("قائمة الموبايل", () => {
  it("تفتح وتغلق وتحتوي على كل روابط التنقل", async () => {
    await mount("/");
    const drawer = container!.querySelector(".mobile-drawer")!;
    expect(drawer.className).not.toContain("is-open");
    await click(container!.querySelector(".mobile-menu"));
    expect(container!.querySelector(".mobile-drawer")!.className).toContain("is-open");
    // الرئيسية، العقارات، تواصل معنا + المفضلة (إيجار شهري/سنوي حُذفا من القائمة)
    expect(container!.querySelector(".mobile-drawer__nav")!.querySelectorAll("a").length).toBe(4);
    await click(container!.querySelector(".mobile-drawer__head .icon-circle"));
    expect(container!.querySelector(".mobile-drawer")!.className).not.toContain("is-open");
  });
});

describe("صور الكرت من برا (CardGallery)", () => {
  it("نقاط بعدد الصور وبحد أقصى 4، وبعد الصورة الرابعة تبقى آخر نقطة معلَّمة", async () => {
    const { CardGallery } = await import("../components/site/CardGallery");
    const host = document.createElement("div");
    document.body.appendChild(host);
    const galleryRoot = createRoot(host);
    const images = Array.from({ length: 6 }, (_, i) => `https://example.com/${i}.jpg`);
    await act(async () => galleryRoot.render(<CardGallery images={images} href="/property/AK-1" alt="بيت" />));
    const track = host.querySelector(".card-gallery__track") as HTMLDivElement;
    Object.defineProperty(track, "clientWidth", { value: 200, configurable: true });
    const activeDot = () => Array.from(host.querySelectorAll(".card-gallery__dots span")).findIndex((d) => d.classList.contains("is-active"));
    expect(host.querySelectorAll(".card-gallery__dots span").length).toBe(4);
    expect(activeDot()).toBe(0);
    // RTL: السكرول سالب
    for (const [slide, dot] of [[1, 1], [3, 3], [4, 3], [5, 3]] as const) {
      await act(async () => {
        track.scrollLeft = -slide * 200;
        track.dispatchEvent(new Event("scroll"));
      });
      expect(activeDot()).toBe(dot);
    }
    // صورتان فقط: نقطتان
    await act(async () => galleryRoot.render(<CardGallery images={images.slice(0, 2)} href="/property/AK-1" alt="بيت" />));
    expect(host.querySelectorAll(".card-gallery__dots span").length).toBe(2);
    act(() => galleryRoot.unmount());
    host.remove();
  });
});
