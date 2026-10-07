import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "wouter";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { pageMeta, whatsappTemplates } from "@/config/site";
import { cities, propertyTypes, rentalTerms, type PropertyType } from "@/data/properties";
import { useDemoStore } from "@/store/DemoStore";
import { useMeta } from "@/hooks/useMeta";
import PublicLayout from "@/components/site/PublicLayout";
import PropertyCard from "@/components/site/PropertyCard";
import WhatsAppButton from "@/components/site/WhatsAppButton";
import ChoiceChips from "@/components/site/ChoiceChips";
import SortMenu from "@/components/site/SortMenu";
import { Ltr } from "@/components/site/pageContext";
import {
  LAST_LISTING_KEY,
  activeFilterCount,
  applyFilters,
  filtersFromParams,
  filtersToParams,
  sortLabels,
  type Filters,
  type SortKey,
} from "@/lib/propertyFilters";

const bedOptions = [
  { value: "0", label: "استوديو" },
  { value: "1", label: "غرفة" },
  { value: "2", label: "غرفتان" },
  { value: "3", label: "3 غرف" },
  { value: "4", label: "4+ غرف" },
];

/** أنواع العقار في صف الفلاتر السريع (البقية في لوحة «فلترة») */
const quickTypes: PropertyType[] = ["شقة", "فيلا", "استوديو"];

const countLabel = (count: number) => (count === 1 ? "عقار" : "عقارات");

/** الفلاتر المختارة بكلام عادي — لرسالة واتساب الجاهزة */
function describeFilters(filters: Filters) {
  const parts: string[] = [];
  if (filters.type) parts.push(filters.type);
  if (filters.term) parts.push(`للإيجار ال${filters.term}`);
  if (filters.city) parts.push(`في ${filters.city}`);
  const beds = bedOptions.find((option) => option.value === filters.beds);
  if (beds) parts.push(beds.label);
  // السعر يُذكر فقط مع نوع إيجار (لا يُقارن الشهري بالسنوي)
  if (filters.term) {
    if (filters.minPrice && filters.maxPrice) parts.push(`بين ${filters.minPrice} و${filters.maxPrice} درهم`);
    else if (filters.minPrice) parts.push(`من ${filters.minPrice} درهم`);
    else if (filters.maxPrice) parts.push(`حتى ${filters.maxPrice} درهم`);
  }
  if (filters.q) parts.push(`(${filters.q})`);
  return parts.join("، ");
}

export default function Properties() {
  useMeta(pageMeta.properties);
  const [params, setParams] = useSearchParams();
  const { properties, favorites } = useDemoStore();

  const filters = useMemo(() => filtersFromParams(params), [params]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [focusSearch, setFocusSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  // حقل البحث يُحدَّث محلياً ثم يُكتب في الرابط بعد توقف الكتابة
  const [searchDraft, setSearchDraft] = useState(filters.q);

  useEffect(() => {
    setSearchDraft(filters.q);
  }, [filters.q]);

  const update = (patch: Partial<Filters>) => {
    setParams(filtersToParams({ ...filters, ...patch }), { replace: true });
  };

  useEffect(() => {
    if (searchDraft === filters.q) return;
    const timer = setTimeout(() => update({ q: searchDraft }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  // آخر بحث في العقارات: رابط «العودة إلى العقارات» في صفحة البيت يرجع لنفس الفلاتر
  useEffect(() => {
    const query = params.toString();
    try {
      sessionStorage.setItem(LAST_LISTING_KEY, `/properties${query ? `?${query}` : ""}`);
    } catch {
      // التخزين غير متاح (وضع خاص) — الرابط يرجع لكل العقارات
    }
  }, [params]);

  // زر «بحث»: يفتح اللوحة والمؤشر داخل حقل البحث مباشرة
  useEffect(() => {
    if (sheetOpen && focusSearch) {
      searchRef.current?.focus();
      setFocusSearch(false);
    }
  }, [sheetOpen, focusSearch]);

  // لوحة الفلترة على الموبايل تغطي الشاشة: نمنع تمرير الصفحة خلفها، وEscape يغلقها
  useEffect(() => {
    if (!sheetOpen) return;
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    if (mobile) document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  // البيوت المؤجّرة تنزل لآخر القائمة (والبطاقة نفسها تظهرها بشفافية 60%)
  const results = useMemo(() => {
    const list = applyFilters(properties, filters, favorites);
    return [...list.filter((p) => p.status !== "مؤجر"), ...list.filter((p) => p.status === "مؤجر")];
  }, [properties, filters, favorites]);
  const filterCount = activeFilterCount(filters);
  const availableCount = results.filter((p) => p.status === "متاح").length;
  // المفضلة على واتساب: كل بيت بالاسم والكود والرابط
  const favoritesMessage = whatsappTemplates.favorites(
    results.map((p) => `• ${p.title} (${p.id}) ${window.location.origin}/property/${p.id}`),
  );
  const summary = describeFilters(filters);

  const resetAll = () => {
    setParams(new URLSearchParams(), { replace: true });
    setSearchDraft("");
  };

  return (
    <PublicLayout whatsappMessage={summary ? whatsappTemplates.filtered(summary) : undefined}>
      <div className="listing-page">
        <div className="container listing-hero">
          <h1>
            عقارات مختارة<span className="listing-hero__more"> للحياة اليومية</span>
          </h1>
          <p>تصفح مجموعة أرماندو القاضي من المساحات السكنية المختارة للإيجار الشهري والسنوي في دبي.</p>
        </div>

        {/* صف الفلاتر: «فلترة» ثابت أوله، ثم صف يتمرر جانبياً — والصف كله ثابت تحت الهيدر */}
        <div className="filter-bar">
          <div className="container filter-bar__inner">
            <button
              className={`filter-toggle ${sheetOpen || filterCount > 0 ? "is-active" : ""}`}
              onClick={() => setSheetOpen((open) => !open)}
              aria-expanded={sheetOpen}
            >
              <SlidersHorizontal size={17} /> فلترة
              {filterCount > 0 && (
                <b>
                  <Ltr>{filterCount}</Ltr>
                </b>
              )}
            </button>
            <div className="filter-pills" role="group" aria-label="فلاتر سريعة">
              <button
                className={filters.q ? "active" : ""}
                onClick={() => {
                  setFocusSearch(true);
                  setSheetOpen(true);
                }}
              >
                <Search size={14} /> {filters.q ? filters.q : "بحث"}
              </button>
              {filters.fav && (
                <button className="active" onClick={() => update({ fav: false })} aria-label="إزالة فلتر المفضلة">
                  المفضلة <X size={14} />
                </button>
              )}
              {rentalTerms.map((term) => (
                <button
                  key={term}
                  className={filters.term === term ? "active" : ""}
                  aria-pressed={filters.term === term}
                  onClick={() => update({ term: filters.term === term ? "" : term })}
                >
                  {term}
                </button>
              ))}
              <span className="filter-pills__divider" aria-hidden="true" />
              {quickTypes.map((type) => (
                <button
                  key={type}
                  className={filters.type === type ? "active" : ""}
                  aria-pressed={filters.type === type}
                  onClick={() => update({ type: filters.type === type ? "" : type })}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* لوحة الفلترة: من الأسفل على الموبايل (85vh)، ولوحة تحت الصف على اللابتوب */}
        {sheetOpen && (
          <div className="filter-sheet">
            <button className="filter-sheet__backdrop" onClick={() => setSheetOpen(false)} aria-label="إغلاق الفلاتر" tabIndex={-1} />
            <div className="container filter-sheet__wrap">
              <div className="filter-drawer" role="dialog" aria-label="فلترة العقارات">
                <div className="filter-drawer__head">
                  <span className="filter-drawer__title">
                    <SlidersHorizontal size={16} /> فلترة
                  </span>
                  <button className="icon-circle" onClick={() => setSheetOpen(false)} aria-label="إغلاق الفلاتر">
                    <X size={20} />
                  </button>
                </div>

                <div className="filter-drawer__grid">
                  <label className="filter-field filter-field--wide">
                    <span>بحث</span>
                    <input
                      ref={searchRef}
                      value={searchDraft}
                      onChange={(event) => setSearchDraft(event.target.value)}
                      placeholder="منطقة أو اسم عقار"
                      aria-label="بحث في العقارات"
                    />
                  </label>

                  {/* المدينة تظهر فقط حين يكون هناك أكثر من مدينة (حالياً دبي فقط) */}
                  {cities.length > 1 && (
                  <ChoiceChips
                    label="المدينة"
                    allLabel="كل الإمارات"
                    options={cities.map((city) => ({ value: city, label: city }))}
                    value={filters.city}
                    onChange={(value) => update({ city: value as Filters["city"] })}
                  />
                  )}

                  <ChoiceChips
                    label="نوع العقار"
                    allLabel="كل الأنواع"
                    options={propertyTypes.map((type) => ({ value: type, label: type }))}
                    value={filters.type}
                    onChange={(value) => update({ type: value as Filters["type"] })}
                  />

                  <ChoiceChips
                    label="غرف النوم"
                    allLabel="أي عدد"
                    options={bedOptions}
                    value={filters.beds}
                    onChange={(value) => update({ beds: value })}
                  />

                  <ChoiceChips
                    label="نوع الإيجار"
                    allLabel="الكل"
                    options={rentalTerms.map((term) => ({ value: term, label: term }))}
                    value={filters.term}
                    onChange={(value) => update({ term: value as Filters["term"] })}
                  />

                  <div className="filter-field filter-field--wide filter-price">
                    <label>
                      <span>أقل سعر (درهم)</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={filters.minPrice}
                        disabled={!filters.term}
                        onChange={(event) => update({ minPrice: event.target.value })}
                        placeholder="0"
                      />
                    </label>
                    <label>
                      <span>أعلى سعر (درهم)</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={filters.maxPrice}
                        disabled={!filters.term}
                        onChange={(event) => update({ maxPrice: event.target.value })}
                        placeholder="بدون حد"
                      />
                    </label>
                  </div>
                </div>

                <div className="filter-drawer__foot">
                  <small>
                    {filters.term
                      ? `السعر بالدرهم للإيجار ال${filters.term}.`
                      : "اختر شهري أو سنوي أولاً ليعمل فلتر السعر."}
                  </small>
                  <button className="text-button" onClick={resetAll}>
                    <RotateCcw size={16} /> إعادة تعيين الفلاتر
                  </button>
                </div>

                {/* زر ثابت أسفل اللوحة بالعدد الحقيقي للنتائج */}
                <div className="filter-drawer__apply">
                  <button className="primary-button" onClick={() => setSheetOpen(false)}>
                    عرض <Ltr>{results.length}</Ltr> {countLabel(results.length)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="container result-meta">
          <span>
            <strong>{results.length}</strong>{" "}
            {availableCount === results.length
              ? results.length === 1
                ? "عقار متاح"
                : "عقارات متاحة"
              : `${countLabel(results.length)} · ${availableCount} ${availableCount === 1 ? "متاح" : "متاحة"}`}
            {filterCount > 0 && <em className="result-meta__hint"> · نتائج مفلترة</em>}
          </span>
          <SortMenu
            label="ترتيب النتائج"
            options={(Object.keys(sortLabels) as SortKey[]).map((key) => ({ value: key, label: sortLabels[key] }))}
            value={filters.sort}
            onChange={(sort) => update({ sort })}
          />
        </div>

        {filters.fav && results.length > 0 && (
          <div className="container section-cta favorites-share">
            <WhatsAppButton label="أرسل مفضلتي عبر واتساب" message={favoritesMessage} />
          </div>
        )}

        {results.length > 0 ? (
          <div className="container property-grid property-grid--listing">
            {results.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="container">
            <div className="empty-state">
              <Search size={26} />
              <h3>{filters.fav ? "لا توجد عقارات في المفضلة بعد" : "لا توجد نتائج مطابقة"}</h3>
              <p>
                {filters.fav
                  ? "اضغط على أيقونة القلب في أي عقار لإضافته هنا والرجوع إليه لاحقاً."
                  : "جرّب توسيع نطاق البحث أو إزالة بعض الفلاتر، أو تواصل معنا لنساعدك في إيجاد الخيار المناسب."}
              </p>
              <div className="empty-state__actions">
                <button className="outline-button" onClick={resetAll}>
                  <RotateCcw size={16} /> إزالة كل الفلاتر
                </button>
                <WhatsAppButton label="اطلب مساعدة مستشار" />
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
