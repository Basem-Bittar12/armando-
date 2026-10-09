import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { bySort, useCatalog } from "@/lib/catalog/store";
import { PROPERTY_STATUSES, type DraftImage, type FullProperty, type PropertyInput } from "@/lib/catalog/types";
import AdminShell from "./AdminShell";
import { errorMessage } from "./PropertiesList";
import { Chips, Field, MultiChips, Stepper, TextInput } from "@/components/admin/Fields";
import ImageManager from "@/components/admin/ImageManager";
import Toggle from "@/components/admin/Toggle";

const bedsLabel = (n: number) => (n === 0 ? "استوديو" : String(n));
const numOrNull = (value: string) => (value.trim() === "" ? null : Number(value));
const textOrNull = (value: string) => (value.trim() === "" ? null : value.trim());

/** فورم إضافة/تعديل عقار — صفحة كاملة، عمود واحد على التلفون، وزرّا الحفظ ثابتان أسفل الشاشة */
export default function PropertyEdit() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  return (
    <AdminShell title={isNew ? "عقار جديد" : "تعديل عقار"}>
      <PropertyForm id={isNew ? null : params.id} />
    </AdminShell>
  );
}

function fromProperty(p: FullProperty): PropertyInput {
  const { images, updated_at: _u, home_order: _h, is_demo: _d, ...rest } = p;
  return { ...rest, images: bySort(images).map((image) => ({ kind: "saved", image }) as DraftImage) };
}

function PropertyForm({ id }: { id: string | null }) {
  const catalog = useCatalog();
  const data = catalog.data!;
  const [, navigate] = useLocation();
  const existing = id ? data.properties.find((p) => p.id === id) : undefined;

  const initial = useMemo<PropertyInput>(() => {
    if (existing) return fromProperty(existing);
    const city = bySort(data.cities.filter((c) => c.is_active))[0];
    const type = bySort(data.property_types.filter((t) => t.is_active))[0];
    return {
      code: catalog.nextCode(),
      title: "",
      description: "",
      title_en: "",
      description_en: "",
      city_id: city?.id ?? "",
      area_id: null,
      type_id: type?.id ?? "",
      bedrooms: 1,
      bathrooms: 1,
      area_sqft: null,
      floor: null,
      year_built: null,
      furnished: false,
      min_rent_period: null,
      max_guests: null,
      map_url: null,
      permit_no: null,
      available_from: null,
      status: "متاح",
      is_new: true,
      is_published: false,
      show_on_home: false,
      prices: [],
      amenity_ids: [],
      images: [],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [form, setForm] = useState<PropertyInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const set = (patch: Partial<PropertyInput>) => {
    setForm((current) => ({ ...current, ...patch }));
    setDirty(true);
  };

  // تنبيه قبل مغادرة الصفحة بتعديلات غير محفوظة
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (id && !existing) {
    return (
      <div className="adm-empty">
        <p>ما لقيت هالعقار — يمكن انحذف.</p>
        <Link href="/admin/properties" className="adm-button">
          رجوع للعقارات
        </Link>
      </div>
    );
  }

  const activeOr = <T extends { id: string; is_active: boolean }>(list: T[], keep: (string | null)[]) =>
    bySort(list as (T & { sort_order: number })[]).filter((item) => item.is_active || keep.includes(item.id));
  const cities = activeOr(data.cities, [form.city_id]);
  const areas = activeOr(data.areas.filter((a) => a.city_id === form.city_id), [form.area_id]);
  const types = activeOr(data.property_types, [form.type_id]);
  const terms = activeOr(data.rental_terms, form.prices.map((p) => p.rental_term_id));
  const amenities = activeOr(data.amenities, form.amenity_ids);
  const homeUsed = data.properties.filter((p) => p.show_on_home && p.id !== existing?.id).length;
  const homeBlocked = !form.show_on_home && homeUsed >= data.settings.home_count;

  const priceOf = (termId: string) => form.prices.find((p) => p.rental_term_id === termId)?.amount;
  const setPrice = (termId: string, value: string) => {
    const amount = Number(value.replace(/[^\d]/g, ""));
    const others = form.prices.filter((p) => p.rental_term_id !== termId);
    set({ prices: amount > 0 ? [...others, { rental_term_id: termId, amount }] : others });
  };

  const validate = (publish: boolean) => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "اكتب اسم العقار";
    if (!form.code.trim()) next.code = "الكود مطلوب";
    if (!form.city_id) next.city = "اختار المدينة";
    if (!form.type_id) next.type = "اختار نوع العقار";
    if (form.map_url && !/^https?:\/\//i.test(form.map_url)) next.map_url = "الرابط لازم يبدأ بـ https://";
    if (publish) {
      if (form.prices.length === 0) next.prices = "للنشر لازم سعر واحد على الأقل";
      if (form.images.length === 0) next.images = "للنشر لازم صورة واحدة على الأقل";
    }
    setErrors(next);
    return next;
  };

  const save = async (publish: boolean) => {
    const found = validate(publish);
    if (Object.keys(found).length) {
      toast.error(Object.values(found)[0]);
      document.querySelector(".adm-field.has-error, .adm-section.has-error")?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setSaving(true);
    try {
      const saved = await catalog.saveProperty({ ...form, is_published: publish });
      setDirty(false);
      toast.success(publish ? `${saved.code} محفوظ ومنشور بالموقع` : `${saved.code} محفوظ كمسودة`);
      navigate("/admin/properties");
    } catch (error) {
      toast.error(errorMessage(error));
      if (/الكود/.test(errorMessage(error))) setErrors((e) => ({ ...e, code: errorMessage(error) }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="adm-form" onSubmit={(event) => event.preventDefault()} noValidate>
      <Link href="/admin/properties" className="adm-back">
        <ChevronRight size={18} /> كل العقارات
      </Link>

      <section className="adm-section">
        <h2>الأساسيات</h2>
        <div className="adm-grid">
          <Field label="اسم العقار" error={errors.title} wide>
            <TextInput value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="مثلاً: شقة بإطلالة على البحر" />
          </Field>
          <Field label="الكود" hint="تلقائي، وفيك تغيّره. ما بيتكرر." error={errors.code}>
            <TextInput value={form.code} dir="ltr" onChange={(e) => set({ code: e.target.value.toUpperCase() })} />
          </Field>
          <Field label="الوصف" wide>
            <textarea className="adm-input adm-textarea" rows={5} value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
        </div>
      </section>

      <section className="adm-section">
        <h2>بالإنجليزي (اختياري)</h2>
        <p className="adm-note">للنسخة الإنجليزية من الموقع. باقي المعلومات (السعر، المنطقة، النوع، المرافق) بتطلع بالإنجليزي لحالها. إذا تركتها فاضية بيطلع الاسم والوصف العربي.</p>
        <div className="adm-grid">
          <Field label="الاسم بالإنجليزي" wide>
            <TextInput value={form.title_en} dir="ltr" lang="en" maxLength={200} placeholder="e.g. Sea-view apartment" onChange={(e) => set({ title_en: e.target.value })} />
          </Field>
          <Field label="الوصف بالإنجليزي" wide>
            <textarea className="adm-input adm-textarea" rows={5} dir="ltr" lang="en" maxLength={5000} value={form.description_en} onChange={(e) => set({ description_en: e.target.value })} />
          </Field>
        </div>
      </section>

      <section className="adm-section">
        <h2>الموقع</h2>
        <div className="adm-grid">
          <Chips
            label="المدينة"
            wide
            options={cities.map((c) => ({ value: c.id, label: c.name_ar, muted: !c.is_active }))}
            value={form.city_id}
            onChange={(city_id) => set({ city_id, area_id: null })}
          />
          {areas.length > 0 ? (
            <Chips
              label="المنطقة"
              wide
              options={[{ value: "", label: "بدون" }, ...areas.map((a) => ({ value: a.id, label: a.name_ar, muted: !a.is_active }))]}
              value={form.area_id ?? ""}
              onChange={(area) => set({ area_id: area || null })}
            />
          ) : (
            <p className="adm-note adm-field--wide">ما في مناطق لهالمدينة بعد — فيك تضيفها من صفحة «الخيارات».</p>
          )}
          <Field label="رابط الموقع على الخريطة (اختياري)" error={errors.map_url} wide>
            <TextInput value={form.map_url ?? ""} dir="ltr" inputMode="url" placeholder="https://maps.google.com/…" onChange={(e) => set({ map_url: textOrNull(e.target.value) })} />
          </Field>
        </div>
      </section>

      <section className="adm-section">
        <h2>المواصفات</h2>
        <div className="adm-grid">
          <Chips label="نوع العقار" wide options={types.map((t) => ({ value: t.id, label: t.name_ar, muted: !t.is_active }))} value={form.type_id} onChange={(type_id) => set({ type_id })} />
          <Stepper label="غرف النوم" value={form.bedrooms} onChange={(bedrooms) => set({ bedrooms })} format={bedsLabel} />
          <Stepper label="الحمامات" value={form.bathrooms} onChange={(bathrooms) => set({ bathrooms })} />
          <Field label="المساحة (قدم²)">
            <TextInput inputMode="numeric" value={form.area_sqft ?? ""} onChange={(e) => set({ area_sqft: numOrNull(e.target.value.replace(/[^\d]/g, "")) })} />
          </Field>
          <Field label="الطابق">
            <TextInput value={form.floor ?? ""} placeholder="مثلاً: 12" onChange={(e) => set({ floor: textOrNull(e.target.value) })} />
          </Field>
          <Field label="سنة البناء">
            <TextInput inputMode="numeric" value={form.year_built ?? ""} onChange={(e) => set({ year_built: numOrNull(e.target.value.replace(/[^\d]/g, "").slice(0, 4)) })} />
          </Field>
          <Field label="الحد الأدنى للإيجار">
            <TextInput value={form.min_rent_period ?? ""} placeholder="مثلاً: 3 أشهر" onChange={(e) => set({ min_rent_period: textOrNull(e.target.value) })} />
          </Field>
          <Field label="أقصى عدد ضيوف (اختياري)">
            <TextInput inputMode="numeric" value={form.max_guests ?? ""} onChange={(e) => set({ max_guests: numOrNull(e.target.value.replace(/[^\d]/g, "")) })} />
          </Field>
          <Field label="رقم التصريح (اختياري)">
            <TextInput value={form.permit_no ?? ""} dir="ltr" onChange={(e) => set({ permit_no: textOrNull(e.target.value) })} />
          </Field>
          <Field label="متاح من (اختياري)">
            <TextInput value={form.available_from ?? ""} placeholder="مثلاً: 1 نوفمبر" onChange={(e) => set({ available_from: textOrNull(e.target.value) })} />
          </Field>
          <div className="adm-field adm-field--wide">
            <Toggle label="مفروش" checked={form.furnished} onChange={(furnished) => set({ furnished })} />
          </div>
        </div>
      </section>

      <section className={`adm-section ${errors.prices ? "has-error" : ""}`}>
        <h2>الأسعار</h2>
        <p className="adm-note">اكتب سعر كل نوع إيجار متاح، واترك الباقي فاضي. الكرت بيعرض أول سعر.</p>
        <div className="adm-grid">
          {terms.map((term) => (
            <Field key={term.id} label={term.name_ar}>
              <div className="adm-price">
                <TextInput
                  inputMode="numeric"
                  dir="ltr"
                  value={priceOf(term.id) ? new Intl.NumberFormat("en-US").format(priceOf(term.id)!) : ""}
                  onChange={(e) => setPrice(term.id, e.target.value)}
                  placeholder="—"
                />
                <span>{term.unit_ar}</span>
              </div>
            </Field>
          ))}
        </div>
        {errors.prices && <small className="adm-field__error">{errors.prices}</small>}
      </section>

      <section className="adm-section">
        <h2>المرافق</h2>
        <MultiChips label="اختار كل اللي موجود بالعقار" options={amenities.map((a) => ({ value: a.id, label: a.name_ar }))} values={form.amenity_ids} onChange={(amenity_ids) => set({ amenity_ids })} />
      </section>

      <section className={`adm-section ${errors.images ? "has-error" : ""}`}>
        <h2>الصور</h2>
        <ImageManager images={form.images} onChange={(images) => set({ images })} />
        {errors.images && <small className="adm-field__error">{errors.images}</small>}
      </section>

      <section className="adm-section">
        <h2>الحالة والظهور</h2>
        <div className="adm-grid">
          <Chips label="الحالة" wide options={PROPERTY_STATUSES.map((s) => ({ value: s, label: s }))} value={form.status} onChange={(status) => set({ status })} />
          <div className="adm-field adm-field--wide adm-toggles">
            <Toggle label="شارة «جديد»" checked={form.is_new} onChange={(is_new) => set({ is_new })} />
            <Toggle
              label="اعرض بالرئيسية"
              checked={form.show_on_home}
              disabled={homeBlocked}
              hint={homeBlocked ? "وصلت لحد عقارات الرئيسية" : undefined}
              onChange={(show_on_home) => set({ show_on_home })}
            />
          </div>
          {homeBlocked && (
            <p className="adm-note adm-field--wide">الرئيسية ممتلئة ({data.settings.home_count} عقارات). شيل عقاراً منها أو كبّر العدد من صفحة «الرئيسية».</p>
          )}
        </div>
      </section>

      <div className="adm-savebar">
        <button type="button" className="adm-button" disabled={saving} onClick={() => save(false)}>
          حفظ كمسودة
        </button>
        <button type="button" className="adm-button adm-button--primary" disabled={saving} onClick={() => save(true)}>
          {saving ? "جاري الحفظ…" : "حفظ ونشر"}
        </button>
      </div>
    </form>
  );
}
