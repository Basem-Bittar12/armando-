import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { bySort, useCatalog } from "@/lib/catalog/store";
import { CatalogError, PROPERTY_STATUSES, type FullProperty, type PropertyStatus } from "@/lib/catalog/types";
import AdminShell from "./AdminShell";
import Toggle from "@/components/admin/Toggle";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type StatusFilter = "all" | PropertyStatus | "draft";

const number = new Intl.NumberFormat("en-US");

/** رسالة الخطأ كما يفهمها صاحب الموقع */
export const errorMessage = (error: unknown) =>
  error instanceof CatalogError ? error.message : "صار خطأ بالحفظ — جرّب مرة ثانية";

/**
 * قائمة العقارات: بحث، فلترة بالحالة، وأزرار سريعة على كل عقار (نشر، الحالة، الرئيسية، تعديل، حذف).
 * على التلفون كل عقار كرت كامل العرض بأزرار كبيرة.
 */
export default function PropertiesList() {
  return (
    <AdminShell
      title="العقارات"
      actions={
        <Link href="/admin/properties/new" className="adm-button adm-button--primary" aria-label="إضافة عقار">
          <Plus size={18} /> <span className="adm-button__text">إضافة عقار</span>
        </Link>
      }
    >
      <PropertiesListBody />
    </AdminShell>
  );
}

function PropertiesListBody() {
  const catalog = useCatalog();
  const data = catalog.data!;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [confirmDelete, setConfirmDelete] = useState<FullProperty | null>(null);
  const [confirmDemo, setConfirmDemo] = useState(false);

  const homeUsed = data.properties.filter((p) => p.show_on_home).length;
  const homeFull = homeUsed >= data.settings.home_count;

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = { all: data.properties.length, draft: 0, متاح: 0, محجوز: 0, مؤجر: 0 };
    for (const p of data.properties) {
      if (!p.is_published) result.draft += 1;
      result[p.status] += 1;
    }
    return result;
  }, [data.properties]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...data.properties]
      .filter((p) => (filter === "all" ? true : filter === "draft" ? !p.is_published : p.status === filter))
      .filter((p) => !q || `${p.title} ${p.code}`.toLowerCase().includes(q))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }, [data.properties, query, filter]);

  const run = async (action: () => Promise<unknown>, success?: string) => {
    try {
      await action();
      if (success) toast.success(success);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const terms = bySort(data.rental_terms);
  const priceLine = (p: FullProperty) => {
    const first = [...p.prices].sort(
      (a, b) => terms.findIndex((t) => t.id === a.rental_term_id) - terms.findIndex((t) => t.id === b.rental_term_id),
    )[0];
    if (!first) return "بدون سعر";
    return `${number.format(first.amount)} ${terms.find((t) => t.id === first.rental_term_id)?.unit_ar ?? "درهم"}`;
  };
  const demoCount = data.properties.filter((p) => p.is_demo).length;
  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "الكل" },
    ...PROPERTY_STATUSES.map((status) => ({ key: status as StatusFilter, label: status })),
    { key: "draft", label: "مسودات" },
  ];

  return (
    <>
      <div className="adm-toolbar">
        <label className="adm-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم أو الكود" aria-label="بحث في العقارات" />
        </label>
        <div className="adm-chips" role="group" aria-label="فلترة بالحالة">
          {filters.map((item) => (
            <button key={item.key} type="button" className={filter === item.key ? "active" : ""} aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>
              {item.label} <b>{counts[item.key]}</b>
            </button>
          ))}
        </div>
        <p className="adm-note">
          بالرئيسية: {homeUsed} من {data.settings.home_count}
          {homeFull && " — وصلت للحد"}
        </p>
      </div>

      {list.length === 0 ? (
        <div className="adm-empty">
          <p>{data.properties.length === 0 ? "ما في عقارات بعد." : "ما في عقارات بهالبحث."}</p>
          {data.properties.length === 0 && (
            <Link href="/admin/properties/new" className="adm-button adm-button--primary">
              <Plus size={18} /> أضف أول عقار
            </Link>
          )}
        </div>
      ) : (
        <ul className="adm-list">
          {list.map((p) => {
            const cover = bySort(p.images)[0];
            const homeBlocked = homeFull && !p.show_on_home;
            return (
              <li key={p.id} className={`adm-item ${p.is_published ? "" : "is-draft"}`}>
                <div className="adm-item__head">
                  <Link href={`/admin/properties/${p.id}`} className="adm-item__thumb" aria-label={`تعديل ${p.title}`}>
                    {cover ? <img src={cover.src_640} alt="" loading="lazy" /> : <span>بدون صورة</span>}
                  </Link>
                  <div className="adm-item__info">
                    <Link href={`/admin/properties/${p.id}`} className="adm-item__title">
                      {p.title}
                    </Link>
                    <p className="adm-item__meta">
                      <bdi dir="ltr">{p.code}</bdi> · {data.property_types.find((t) => t.id === p.type_id)?.name_ar}
                      {p.area_id && ` · ${data.areas.find((a) => a.id === p.area_id)?.name_ar}`}
                    </p>
                    <p className="adm-item__price">{priceLine(p)}</p>
                    <p className="adm-item__badges">
                      <span className={p.is_published ? "badge badge--on" : "badge"}>{p.is_published ? "منشور" : "مسودة"}</span>
                      {p.show_on_home && <span className="badge badge--on">بالرئيسية</span>}
                      {p.is_demo && <span className="badge">تجريبي</span>}
                    </p>
                  </div>
                </div>

                <div className="adm-item__status" role="radiogroup" aria-label={`حالة ${p.title}`}>
                  {PROPERTY_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      role="radio"
                      aria-checked={p.status === status}
                      className={p.status === status ? "active" : ""}
                      onClick={() => p.status !== status && run(() => catalog.setStatus(p.id, status), `${p.code}: الحالة الآن ${status}`)}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="adm-item__toggles">
                  <Toggle
                    label="منشور"
                    checked={p.is_published}
                    onChange={(value) => run(() => catalog.setPublished(p.id, value), value ? `${p.code} منشور بالموقع` : `${p.code} صار مسودة`)}
                  />
                  <Toggle
                    label="اعرض بالرئيسية"
                    checked={p.show_on_home}
                    disabled={homeBlocked}
                    hint={homeBlocked ? "وصلت لحد عقارات الرئيسية" : undefined}
                    onChange={(value) => run(() => catalog.setOnHome(p.id, value))}
                  />
                </div>
                {homeBlocked && (
                  <p className="adm-item__hint">
                    الرئيسية ممتلئة ({data.settings.home_count}). شيل عقاراً منها أو كبّر العدد من <Link href="/admin/home">صفحة الرئيسية</Link>.
                  </p>
                )}

                <div className="adm-item__actions">
                  <Link href={`/admin/properties/${p.id}`} className="adm-button">
                    <Pencil size={17} /> تعديل
                  </Link>
                  <button type="button" className="adm-button adm-button--danger" onClick={() => setConfirmDelete(p)}>
                    <Trash2 size={17} /> حذف
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {demoCount > 0 && (
        <section className="adm-danger-zone">
          <h2>قبل الإطلاق</h2>
          <p>في {demoCount} عقارات تجريبية (منقولة من النسخة الأولى). احذفها قبل ما ينطلق الموقع.</p>
          <button type="button" className="adm-button adm-button--danger" onClick={() => setConfirmDemo(true)}>
            <Trash2 size={17} /> حذف كل العقارات التجريبية
          </button>
        </section>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={`حذف ${confirmDelete?.code ?? ""}؟`}
        body={`«${confirmDelete?.title ?? ""}» رح ينحذف مع صوره وأسعاره. ما في رجعة.`}
        confirmLabel="حذف"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          const target = confirmDelete!;
          setConfirmDelete(null);
          run(() => catalog.deleteProperty(target.id), `تم حذف ${target.code}`);
        }}
      />
      <ConfirmDialog
        open={confirmDemo}
        title="حذف كل العقارات التجريبية؟"
        body={`رح ينحذف ${demoCount} عقارات تجريبية مع صورها. عقاراتك الحقيقية ما بتتأثر.`}
        confirmLabel="حذف الكل"
        onCancel={() => setConfirmDemo(false)}
        onConfirm={() => {
          setConfirmDemo(false);
          run(async () => {
            const removed = await catalog.deleteDemo();
            toast.success(`انحذف ${removed} عقارات تجريبية`);
          });
        }}
      />
    </>
  );
}
