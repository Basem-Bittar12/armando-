import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "wouter";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { pageMetaFor, whatsappTemplatesFor } from "@/config/site";
import { propertyUrl, useLang, useT, type Lang } from "@/i18n/lang";
import { useCatalog } from "@/lib/catalog/store";
import { filterOptions, publishedProperties } from "@/lib/catalog/view";
import { useFavorites } from "@/store/Favorites";
import { CardSkeletons, LoadError } from "@/components/site/CatalogState";
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
  sortLabelsEn,
  type Filters,
  type SortKey,
} from "@/lib/propertyFilters";

const bedLabel = (beds: number, lang: Lang = "ar") =>
  lang === "en"
    ? beds === 0 ? "Studio" : beds === 1 ? "1 bedroom" : beds >= 4 ? "4+ bedrooms" : `${beds} bedrooms`
    : beds === 0 ? "استوديو" : beds === 1 ? "غرفة" : beds === 2 ? "غرفتان" : beds >= 4 ? "4+ غرف" : `${beds} غرف`;

/** خيارات غرف النوم من البيانات نفسها (4 فأكثر تُجمع بخيار واحد «4+ غرف») */
const bedOptionsFrom = (beds: number[], lang: Lang) =>
  Array.from(new Set(beds.map((value) => Math.min(value, 4)))).map((value) => ({ value: String(value), label: bedLabel(value, lang) }));

/** عدد أنواع العقار في صف الفلاتر السريع (البقية في لوحة «فلترة») */
const QUICK_TYPES = 3;

const countLabel = (count: number, lang: Lang = "ar") => (lang === "en" ? (count === 1 ? "home" : "homes") : count === 1 ? "عقار" : "عقارات");

/** الفلاتر المختارة بكلام عادي — لرسالة واتساب الجاهزة */
function describeFilters(filters: Filters, lang: Lang) {
  const parts: string[] = [];
  const en = lang === "en";
  if (filters.type) parts.push(filters.type);
  if (filters.term) parts.push(en ? `for ${filters.term.toLowerCase()} rent` : `للإيجار ال${filters.term}`);
  if (filters.city) parts.push(en ? `in ${filters.city}` : `في ${filters.city}`);
  if (filters.beds) parts.push(bedLabel(Number(filters.beds), lang));
  if (filters.minPrice && filters.maxPrice) parts.push(en ? `between ${filters.minPrice} and ${filters.maxPrice} AED` : `بين ${filters.minPrice} و${filters.maxPrice} درهم`);
  else if (filters.minPrice) parts.push(en ? `from ${filters.minPrice} AED` : `من ${filters.minPrice} درهم`);
  else if (filters.maxPrice) parts.push(en ? `up to ${filters.maxPrice} AED` : `حتى ${filters.maxPrice} درهم`);
  if (filters.q) parts.push(`(${filters.q})`);
  return parts.join(en ? ", " : "، ");
}

export default function Properties() {
  const lang = useLang();
  const t = useT();
  const templates = whatsappTemplatesFor(lang);
  useMeta(pageMetaFor(lang).properties);
  const [params, setParams] = useSearchParams();
  const { data, status, reload } = useCatalog();
  const { favorites } = useFavorites();
  const properties = useMemo(() => (data ? publishedProperties(data, lang) : []), [data, lang]);
  // الفلاتر تُبنى من الخيارات المفعّلة التي عليها عقار منشور
  const options = useMemo(
    () => (data ? filterOptions(data, lang) : { cities: [], types: [], terms: [], beds: [] }),
    [data, lang],
  );
  const bedOptions = useMemo(() => bedOptionsFrom(options.beds, lang), [options.beds, lang]);
  const quickTypes = options.types.slice(0, QUICK_TYPES);
  const { cities, terms: rentalTerms, types: propertyTypes } = options;

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
      sessionStorage.setItem(`${LAST_LISTING_KEY}:${lang}`, `/properties${query ? `?${query}` : ""}`);
    } catch {
      // التخزين غير متاح (وضع خاص) — الرابط يرجع لكل العقارات
    }
  }, [params, lang]);

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
  const favoritesMessage = templates.favorites(results.map((p) => `• ${p.title} (${p.id}) ${propertyUrl(lang, p.id)}`));
  const summary = describeFilters(filters, lang);

  const resetAll = () => {
    setParams(new URLSearchParams(), { replace: true });
    setSearchDraft("");
  };

  return (
    <PublicLayout whatsappMessage={summary ? templates.filtered(summary) : undefined}>
      <div className="listing-page">
        <div className="container listing-hero">
          <h1>
            {t("عقارات مختارة", "Selected homes")}
            <span className="listing-hero__more">{t(" للحياة اليومية", " for everyday living")}</span>
          </h1>
          <p>
            {t(
              "تصفح مجموعة أرماندو القاضي من المساحات السكنية المختارة للإيجار الشهري والسنوي في دبي.",
              "Browse the Armando Alkadi collection of selected homes for monthly and yearly rent in Dubai.",
            )}
          </p>
        </div>

        {/* صف الفلاتر: «فلترة» ثابت أوله، ثم صف يتمرر جانبياً — والصف كله ثابت تحت الهيدر */}
        <div className="filter-bar">
          <div className="container filter-bar__inner">
            <button
              className={`filter-toggle ${sheetOpen || filterCount > 0 ? "is-active" : ""}`}
              onClick={() => setSheetOpen((open) => !open)}
              aria-expanded={sheetOpen}
            >
              <SlidersHorizontal size={17} /> {t("فلترة", "Filters")}
              {filterCount > 0 && (
                <b>
                  <Ltr>{filterCount}</Ltr>
                </b>
              )}
            </button>
            <div className="filter-pills" role="group" aria-label={t("فلاتر سريعة", "Quick filters")}>
              <button
                className={filters.q ? "active" : ""}
                onClick={() => {
                  setFocusSearch(true);
                  setSheetOpen(true);
                }}
              >
                <Search size={14} /> {filters.q ? filters.q : t("بحث", "Search")}
              </button>
              {filters.fav && (
                <button className="active" onClick={() => update({ fav: false })} aria-label={t("إزالة فلتر المفضلة", "Remove favorites filter")}>
                  {t("المفضلة", "Favorites")} <X size={14} />
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
            <button className="filter-sheet__backdrop" onClick={() => setSheetOpen(false)} aria-label={t("إغلاق الفلاتر", "Close filters")} tabIndex={-1} />
            <div className="container filter-sheet__wrap">
              <div className="filter-drawer" role="dialog" aria-label={t("فلترة العقارات", "Filter homes")}>
                <div className="filter-drawer__head">
                  <span className="filter-drawer__title">
                    <SlidersHorizontal size={16} /> {t("فلترة", "Filters")}
                  </span>
                  <button className="icon-circle" onClick={() => setSheetOpen(false)} aria-label={t("إغلاق الفلاتر", "Close filters")}>
                    <X size={20} />
                  </button>
                </div>

                <div className="filter-drawer__grid">
                  <label className="filter-field filter-field--wide">
                    <span>{t("بحث", "Search")}</span>
                    <input
                      ref={searchRef}
                      value={searchDraft}
                      onChange={(event) => setSearchDraft(event.target.value)}
                      placeholder={t("منطقة أو اسم عقار", "Area or home name")}
                      aria-label={t("بحث في العقارات", "Search homes")}
                    />
                  </label>

                  {/* المدينة تظهر فقط حين يكون هناك أكثر من مدينة (حالياً دبي فقط) */}
                  {cities.length > 1 && (
                  <ChoiceChips
                    label={t("المدينة", "City")}
                    allLabel={t("كل الإمارات", "All emirates")}
                    options={cities.map((city) => ({ value: city, label: city }))}
                    value={filters.city}
                    onChange={(value) => update({ city: value })}
                  />
                  )}

                  <ChoiceChips
                    label={t("نوع العقار", "Property type")}
                    allLabel={t("كل الأنواع", "All types")}
                    options={propertyTypes.map((type) => ({ value: type, label: type }))}
                    value={filters.type}
                    onChange={(value) => update({ type: value })}
                  />

                  <ChoiceChips
                    label={t("غرف النوم", "Bedrooms")}
                    allLabel={t("أي عدد", "Any")}
                    options={bedOptions}
                    value={filters.beds}
                    onChange={(value) => update({ beds: value })}
                  />

                  <ChoiceChips
                    label={t("نوع الإيجار", "Rental type")}
                    allLabel={t("الكل", "All")}
                    options={rentalTerms.map((term) => ({ value: term, label: term }))}
                    value={filters.term}
                    onChange={(value) => update({ term: value })}
                  />

                  <div className="filter-field filter-field--wide filter-price">
                    <label>
                      <span>{t("أقل سعر (درهم)", "Min price (AED)")}</span>
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
                      <span>{t("أعلى سعر (درهم)", "Max price (AED)")}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={filters.maxPrice}
                        onChange={(event) => update({ maxPrice: event.target.value })}
                        placeholder={t("بدون حد", "No limit")}
                      />
                    </label>
                  </div>
                </div>

                <div className="filter-drawer__foot">
                  <small>
                    {filters.term
                      ? t(`السعر بالدرهم للإيجار ال${filters.term}.`, `Price in AED for ${filters.term.toLowerCase()} rent.`)
                      : t("السعر بالدرهم كما هو معروض لكل عقار (شهري أو سنوي).", "Price in AED as shown on each home (monthly or yearly).")}
                  </small>
                  <button className="text-button" onClick={resetAll}>
                    <RotateCcw size={16} /> {t("إعادة تعيين الفلاتر", "Reset filters")}
                  </button>
                </div>

                {/* زر ثابت أسفل اللوحة بالعدد الحقيقي للنتائج */}
                <div className="filter-drawer__apply">
                  <button className="primary-button" onClick={() => setSheetOpen(false)}>
                    {t("عرض", "Show")} <Ltr>{results.length}</Ltr> {countLabel(results.length, lang)}
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
              ? lang === "en"
                ? results.length === 1
                  ? "home available"
                  : "homes available"
                : results.length === 1
                  ? "عقار متاح"
                  : "عقارات متاحة"
              : lang === "en"
                ? `${countLabel(results.length, lang)} · ${availableCount} available`
                : `${countLabel(results.length)} · ${availableCount} ${availableCount === 1 ? "متاح" : "متاحة"}`}
            {filterCount > 0 && <em className="result-meta__hint">{t(" · نتائج مفلترة", " · filtered results")}</em>}
          </span>
          <SortMenu
            label={t("ترتيب النتائج", "Sort results")}
            options={(Object.keys(sortLabels) as SortKey[]).map((key) => ({ value: key, label: (lang === "en" ? sortLabelsEn : sortLabels)[key] }))}
            value={filters.sort}
            onChange={(sort) => update({ sort })}
          />
        </div>

        {filters.fav && results.length > 0 && (
          <div className="container section-cta favorites-share">
            <WhatsAppButton label={t("أرسل مفضلتي عبر واتساب", "Send my favorites on WhatsApp")} message={favoritesMessage} />
          </div>
        )}

        {status === "loading" ? (
          <div className="container property-grid property-grid--listing" aria-busy="true">
            <CardSkeletons count={4} />
          </div>
        ) : status === "error" ? (
          <div className="container">
            <LoadError onRetry={reload} />
          </div>
        ) : results.length > 0 ? (
          <div className="container property-grid property-grid--listing">
            {/* عنوان للقارئات الصوتية فقط: ترتيب العناوين h1 ← h2 ← عناوين الكروت h3 */}
            <h2 className="sr-only">{t("نتائج البحث", "Search results")}</h2>
            {results.map((property, index) => (
              <PropertyCard key={property.id} property={property} priority={index < 2} />
            ))}
          </div>
        ) : (
          <div className="container">
            <div className="empty-state">
              <Search size={26} />
              <h3>{filters.fav ? t("لا توجد عقارات في المفضلة بعد", "No favorites yet") : t("لا توجد نتائج مطابقة", "No matching homes")}</h3>
              <p>
                {filters.fav
                  ? t("اضغط على أيقونة القلب في أي عقار لإضافته هنا والرجوع إليه لاحقاً.", "Tap the heart on any home to save it here and come back to it later.")
                  : t(
                      "جرّب توسيع نطاق البحث أو إزالة بعض الفلاتر، أو تواصل معنا لنساعدك في إيجاد الخيار المناسب.",
                      "Try widening your search or removing some filters, or contact us and we will help you find the right home.",
                    )}
              </p>
              <div className="empty-state__actions">
                <button className="outline-button" onClick={resetAll}>
                  <RotateCcw size={16} /> {t("إزالة كل الفلاتر", "Clear all filters")}
                </button>
                <WhatsAppButton label={t("اطلب مساعدة مستشار", "Ask an advisor for help")} />
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
