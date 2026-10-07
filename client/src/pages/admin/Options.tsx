import { useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { bySort, useCatalog } from "@/lib/catalog/store";
import type { AreaRow, OptionKind, OptionRow, RentalTermRow } from "@/lib/catalog/types";
import { resizeImage } from "@/lib/imageResize";
import AdminShell from "./AdminShell";
import { errorMessage } from "./PropertiesList";
import { Chips, Field, TextInput } from "@/components/admin/Fields";
import { SortableList } from "@/components/admin/Sortable";
import Toggle from "@/components/admin/Toggle";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const TABS: { kind: OptionKind; label: string; single: string }[] = [
  { kind: "cities", label: "المدن", single: "مدينة" },
  { kind: "areas", label: "المناطق", single: "منطقة" },
  { kind: "property_types", label: "أنواع العقار", single: "نوع عقار" },
  { kind: "rental_terms", label: "أنواع الإيجار", single: "نوع إيجار" },
  { kind: "amenities", label: "المرافق", single: "مرفق" },
];

type AnyRow = OptionRow & Partial<AreaRow> & Partial<RentalTermRow>;

/**
 * صفحة «الخيارات»: إضافة وتعديل وترتيب وإيقاف المدن والمناطق وأنواع العقار وأنواع الإيجار والمرافق.
 * الخيار المستعمل بعقار ما بينحذف — بيتوقف بس (يختفي من الموقع ويضل على العقارات القديمة).
 */
export default function Options() {
  return (
    <AdminShell title="الخيارات">
      <OptionsBody />
    </AdminShell>
  );
}

function OptionsBody() {
  const catalog = useCatalog();
  const data = catalog.data!;
  const [tab, setTab] = useState<OptionKind>("cities");
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [confirm, setConfirm] = useState<AnyRow | null>(null);
  const meta = TABS.find((t) => t.kind === tab)!;
  const rows = bySort(data[tab] as AnyRow[]);
  const cityName = (id?: string) => data.cities.find((c) => c.id === id)?.name_ar ?? "";

  const blank = (): AnyRow => ({
    id: "",
    name_ar: "",
    name_en: "",
    sort_order: 0,
    is_active: true,
    ...(tab === "areas" ? { city_id: bySort(data.cities)[0]?.id ?? "", cover_url: null } : {}),
    ...(tab === "rental_terms" ? { unit_ar: "درهم / ", unit_en: "AED / " } : {}),
  });

  const run = async (action: () => Promise<unknown>, success?: string) => {
    try {
      await action();
      if (success) toast.success(success);
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  };

  return (
    <>
      <div className="adm-chips adm-tabs-row" role="tablist" aria-label="نوع الخيارات">
        {TABS.map((t) => (
          <button
            key={t.kind}
            type="button"
            role="tab"
            aria-selected={tab === t.kind}
            className={tab === t.kind ? "active" : ""}
            onClick={() => {
              setTab(t.kind);
              setEditing(null);
            }}
          >
            {t.label} <b>{(data[t.kind] as OptionRow[]).length}</b>
          </button>
        ))}
      </div>

      {editing ? (
        <OptionEditor
          kind={tab}
          single={meta.single}
          row={editing}
          cities={bySort(data.cities)}
          onCancel={() => setEditing(null)}
          onSave={async (row) => {
            if (tab === "rental_terms" && !row.unit_ar?.trim()) return toast.error("نص الوحدة مطلوب، مثل «درهم / شهري»");
            if (tab === "areas" && !row.city_id) return toast.error("اختار المدينة");
            const ok = await run(() => catalog.saveOption(tab, row as OptionRow), row.id ? "انحفظ التعديل" : `انضافت ${meta.single}`);
            if (ok) setEditing(null);
          }}
        />
      ) : (
        <button type="button" className="adm-button adm-button--primary adm-add" onClick={() => setEditing(blank())}>
          <Plus size={18} /> إضافة {meta.single}
        </button>
      )}

      {rows.length === 0 ? (
        <p className="adm-note">ما في شي هون بعد.</p>
      ) : (
        <SortableList
          items={rows}
          className="adm-options"
          itemClassName="adm-option"
          onReorder={(ids) => run(() => catalog.reorderOptions(tab, ids))}
          renderItem={(row, handle) => {
            const used = catalog.usageCount(tab, row.id);
            return (
              <>
                {handle}
                {tab === "areas" && (row.cover_url ? <img className="adm-option__cover" src={row.cover_url} alt="" /> : <span className="adm-option__cover" />)}
                <div className="adm-option__names">
                  <strong className={row.is_active ? "" : "is-off"}>{row.name_ar}</strong>
                  <span>
                    {row.name_en && <bdi dir="ltr">{row.name_en}</bdi>}
                    {tab === "areas" && ` · ${cityName(row.city_id)}`}
                    {tab === "rental_terms" && ` · ${row.unit_ar}`}
                    {used > 0 && ` · مستعمل (${used})`}
                    {!row.is_active && " · موقوف"}
                  </span>
                </div>
                <div className="adm-option__actions">
                  <Toggle
                    label={row.is_active ? "مفعّل" : "موقوف"}
                    checked={row.is_active}
                    onChange={(is_active) => run(() => catalog.saveOption(tab, { ...row, is_active } as OptionRow))}
                  />
                  <button type="button" className="adm-icon-button" aria-label={`تعديل ${row.name_ar}`} onClick={() => setEditing(row)}>
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    className="adm-icon-button adm-icon-button--danger"
                    aria-label={used ? `${row.name_ar} مستعمل — أوقفه بدل الحذف` : `حذف ${row.name_ar}`}
                    title={used ? "مستعمل بعقار — أوقفه بدل الحذف" : undefined}
                    disabled={used > 0}
                    onClick={() => setConfirm(row)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </>
            );
          }}
        />
      )}
      <p className="adm-note">الخيار المستعمل بعقار ما بينحذف — أوقفه بدل الحذف، فبيختفي من الموقع والفلاتر ويضل على العقارات القديمة.</p>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={`حذف «${confirm?.name_ar ?? ""}»؟`}
        body="الخيار رح ينحذف نهائياً."
        confirmLabel="حذف"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const target = confirm!;
          setConfirm(null);
          run(() => catalog.deleteOption(tab, target.id), "انحذف");
        }}
      />
    </>
  );
}

function OptionEditor({
  kind,
  single,
  row,
  cities,
  onSave,
  onCancel,
}: {
  kind: OptionKind;
  single: string;
  row: AnyRow;
  cities: OptionRow[];
  onSave: (row: AnyRow) => void;
  onCancel: () => void;
}) {
  const catalog = useCatalog();
  const [draft, setDraft] = useState<AnyRow>(row);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<AnyRow>) => setDraft((d) => ({ ...d, ...patch }));
  const liveCover = catalog.data!.areas.find((a) => a.id === row.id)?.cover_url ?? null;

  const uploadCover = async (file?: File) => {
    if (!file || !row.id) return;
    setUploading(true);
    try {
      await catalog.uploadAreaCover(row.id, await resizeImage(file));
      toast.success("تغيّرت صورة المنطقة");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="adm-section adm-editor">
      <h2>{row.id ? `تعديل ${single}` : `${single} جديدة`}</h2>
      <div className="adm-grid">
        <Field label="الاسم بالعربي">
          <TextInput value={draft.name_ar} onChange={(e) => set({ name_ar: e.target.value })} autoFocus />
        </Field>
        <Field label="الاسم بالإنجليزي" hint="للنسخة الإنجليزية لاحقاً">
          <TextInput value={draft.name_en} dir="ltr" onChange={(e) => set({ name_en: e.target.value })} />
        </Field>
        {kind === "rental_terms" && (
          <>
            <Field label="نص الوحدة (عربي)" hint="بيطلع جنب السعر، مثل «درهم / شهري»">
              <TextInput value={draft.unit_ar ?? ""} onChange={(e) => set({ unit_ar: e.target.value })} />
            </Field>
            <Field label="نص الوحدة (إنجليزي)">
              <TextInput value={draft.unit_en ?? ""} dir="ltr" onChange={(e) => set({ unit_en: e.target.value })} />
            </Field>
          </>
        )}
        {kind === "areas" && (
          <>
            <Chips label="المدينة" wide options={cities.map((c) => ({ value: c.id, label: c.name_ar }))} value={draft.city_id ?? null} onChange={(city_id) => set({ city_id })} />
            <div className="adm-field adm-field--wide">
              <span className="adm-field__label">صورة الغلاف (قسم «اكتشف المكان»)</span>
              {row.id ? (
                <div className="adm-cover">
                  {liveCover ? <img src={liveCover} alt="" /> : <span className="adm-cover__empty">بدون صورة — بتطلع صورة أول عقار بالمنطقة</span>}
                  <button type="button" className="adm-button" disabled={uploading} onClick={() => fileRef.current?.click()}>
                    <ImagePlus size={18} /> {uploading ? "جاري الرفع…" : liveCover ? "تغيير الصورة" : "إضافة صورة"}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadCover(e.target.files?.[0])} />
                </div>
              ) : (
                <small className="adm-field__hint">احفظ المنطقة أول، بعدين فيك تضيف صورتها.</small>
              )}
            </div>
          </>
        )}
      </div>
      <div className="adm-editor__actions">
        <button type="button" className="adm-button" onClick={onCancel}>
          إلغاء
        </button>
        <button type="button" className="adm-button adm-button--primary" onClick={() => onSave(draft)}>
          حفظ
        </button>
      </div>
    </section>
  );
}
