import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "wouter";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { pageMeta, whatsappTemplates } from "@/config/site";
import { cities, propertyTypes, rentalTerms, type PropertyType } from "@/data/properties";
import { useDemoStore } from "@/store/DemoStore";
import { useMeta } from "@/hooks/useMeta";
import PublicLayout from "@/components/site/PublicLayout";
import PropertyCard from "@/components/site/PropertyCard";
import WhatsAppButton from "@/components/site/WhatsAppButton";
import { Ltr } from "@/components/site/pageContext";
import {
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
  if (filters.minPrice && filters.maxPrice) parts.push(`بين ${filters.minPrice} و${filters.maxPrice} درهم`);
  else if (filters.minPrice) parts.push(`من ${filters.minPrice} درهم`);
  else if (filters.maxPrice) parts.push(`حتى ${filters.maxPrice} درهم`);
  if (filters.q) parts.push(`(${filters.q})`);
  return parts.join("، ");
}

export default function Properties() {
  useMeta(pageMeta.properties);
  const [params, setParams] = useSearchParams();
  const { properties, favorites } = useDemoStore();

  const filters = useMemo(() => filtersFromParams(params), [params]);
  const [sheetOpen, setSheetOpen] = useState(false);
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
          <p>تصفح مجموعة أرماندو القاضي من المساحات السكنية المختارة للإيجار الشهري والسنوي في الإمارات.</p>
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
                  <label>
                    <span>المدينة</span>
                    <select
                      value={filters.city}
                      onChange={(event) => update({ city: event.target.value as Filters["city"] })}
                    >
                      <option value="">كل الإمارات</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>نوع العقار</span>
                    <select
                      value={filters.type}
                      onChange={(event) => update({ type: event.target.value as Filters["type"] })}
                    >
                      <option value="">كل الأنواع</option>
                      {propertyTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>غرف النوم</span>
                    <select value={filters.beds} onChange={(event) => update({ beds: event.target.value })}>
                      <option value="">أي عدد</option>
                      {bedOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>بحث</span>
                    <input
                      value={searchDraft}
                      onChange={(event) => setSearchDraft(event.target.value)}
                      placeholder="منطقة أو اسم عقار"
                      aria-label="بحث في العقارات"
                    />
                  </label>

                  <label>
                    <span>أقل سعر (درهم)</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={filters.minPrice}
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
                      onChange={(event) => update({ maxPrice: event.target.value })}
                      placeholder="بدون حد"
                    />
                  </label>
                </div>

                <div className="filter-drawer__foot">
                  <small>السعر يُقارن بقيمة الإيجار كما هي معروضة (شهري أو سنوي حسب العقار).</small>
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
            <strong>{results.length}</strong> {results.length === 1 ? "عقار متاح" : "عقارات متاحة"}
            {filterCount > 0 && <em className="result-meta__hint"> · نتائج مفلترة</em>}
          </span>
          <label className="sort-select">
            <span className="sr-only">ترتيب النتائج</span>
            <select value={filters.sort} onChange={(event) => update({ sort: event.target.value as SortKey })}>
              {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {sortLabels[key]}
                </option>
              ))}
            </select>
          </label>
        </div>

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
