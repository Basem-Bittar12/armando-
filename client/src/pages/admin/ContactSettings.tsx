import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCatalog } from "@/lib/catalog/store";
import type { SiteContact } from "@/lib/catalog/types";
import { Field, TextInput } from "@/components/admin/Fields";
import AdminShell from "./AdminShell";
import { errorMessage } from "./PropertiesList";

/** معلومات التواصل: تظهر بالهيدر والفوتر وصفحة التواصل وأزرار واتساب بكل الموقع */
export default function ContactSettings() {
  return (
    <AdminShell title="معلومات التواصل">
      <ContactBody />
    </AdminShell>
  );
}

function ContactBody() {
  const catalog = useCatalog();
  const settings = catalog.data!.settings;
  const [form, setForm] = useState<SiteContact>({
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,
    address: settings.address,
    hours: settings.hours,
    address_en: settings.address_en ?? "",
    hours_en: settings.hours_en ?? "",
    social: settings.social.map((item) => ({ ...item })),
  });
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<SiteContact>) => setForm((current) => ({ ...current, ...patch }));
  const setSocial = (index: number, patch: Partial<SiteContact["social"][number]>) =>
    set({ social: form.social.map((item, i) => (i === index ? { ...item, ...patch } : item)) });

  const save = async () => {
    setSaving(true);
    try {
      await catalog.saveContact(form);
      toast.success("انحفظت معلومات التواصل — ظاهرة بالموقع هلأ");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="adm-form" onSubmit={(event) => event.preventDefault()} noValidate>
      <section className="adm-section">
        <h2>الهاتف وواتساب</h2>
        <div className="adm-grid">
          <Field label="رقم الهاتف (كما يظهر بالموقع)" hint="مثلاً: +971 50 123 4567">
            <TextInput dir="ltr" inputMode="tel" autoComplete="off" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="رقم واتساب" hint="دولي، أرقام فقط بدون + أو مسافات: 971501234567">
            <TextInput dir="ltr" inputMode="numeric" value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value.replace(/\D/g, "") })} />
          </Field>
        </div>
      </section>

      <section className="adm-section">
        <h2>العنوان والبريد</h2>
        <div className="adm-grid">
          <Field label="العنوان" wide>
            <TextInput value={form.address} onChange={(e) => set({ address: e.target.value })} />
          </Field>
          <Field label="البريد الإلكتروني (اختياري)" hint="فاضي = ما بيظهر بالموقع">
            <TextInput dir="ltr" type="email" inputMode="email" value={form.email ?? ""} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="ساعات العمل (اختياري)" hint="مثلاً: يومياً 9 صباحاً – 9 مساءً. فاضي = ما بتظهر">
            <TextInput value={form.hours ?? ""} onChange={(e) => set({ hours: e.target.value })} />
          </Field>
        </div>
      </section>

      <section className="adm-section">
        <h2>بالإنجليزي (اختياري)</h2>
        <p className="adm-note">للنسخة الإنجليزية من الموقع. إذا تركتها فاضية بيطلع العنوان وساعات العمل بالعربي.</p>
        <div className="adm-grid">
          <Field label="العنوان بالإنجليزي" wide>
            <TextInput dir="ltr" lang="en" value={form.address_en ?? ""} onChange={(e) => set({ address_en: e.target.value })} />
          </Field>
          <Field label="ساعات العمل بالإنجليزي">
            <TextInput dir="ltr" lang="en" value={form.hours_en ?? ""} onChange={(e) => set({ hours_en: e.target.value })} />
          </Field>
        </div>
      </section>

      <section className="adm-section">
        <h2>حسابات التواصل الاجتماعي</h2>
        <p className="adm-note">بتظهر بالفوتر. اتركها فاضية إذا ما في حسابات.</p>
        <div className="adm-social">
          {form.social.map((item, index) => (
            <div key={index} className="adm-social__row">
              <div className="adm-grid">
                <Field label="الاسم">
                  <TextInput value={item.label} placeholder="Instagram" onChange={(e) => setSocial(index, { label: e.target.value })} />
                </Field>
                <Field label="الرابط">
                  <TextInput dir="ltr" inputMode="url" value={item.href} placeholder="https://…" onChange={(e) => setSocial(index, { href: e.target.value })} />
                </Field>
              </div>
              <button
                type="button"
                className="adm-icon-button adm-icon-button--danger"
                aria-label={`حذف ${item.label || "الحساب"}`}
                onClick={() => set({ social: form.social.filter((_, i) => i !== index) })}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button type="button" className="adm-button" onClick={() => set({ social: [...form.social, { label: "", href: "" }] })}>
            <Plus size={18} /> إضافة حساب
          </button>
        </div>
      </section>

      <div className="adm-savebar adm-savebar--single">
        <button type="button" className="adm-button adm-button--primary" disabled={saving} onClick={save}>
          {saving ? "جاري الحفظ…" : "حفظ"}
        </button>
      </div>
    </form>
  );
}
