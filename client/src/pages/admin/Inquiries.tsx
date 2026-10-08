import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCatalog } from "@/lib/catalog/store";
import { INQUIRY_STATUSES, type Inquiry, type InquiryStatus } from "@/lib/catalog/types";
import { LoadError } from "@/components/site/CatalogState";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import AdminShell from "./AdminShell";
import { errorMessage } from "./PropertiesList";

const dateFormat = new Intl.DateTimeFormat("ar-AE-u-nu-latn", { dateStyle: "medium", timeStyle: "short" });

/** طلبات نموذج «تواصل معنا»: الأحدث أولاً، مع حالة لكل طلب واتصال/واتساب بضغطة */
export default function Inquiries() {
  return (
    <AdminShell title="الاستفسارات">
      <InquiriesBody />
    </AdminShell>
  );
}

type Filter = "all" | InquiryStatus;

function InquiriesBody() {
  const catalog = useCatalog();
  const [items, setItems] = useState<Inquiry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmDelete, setConfirmDelete] = useState<Inquiry | null>(null);

  const load = useCallback(() => {
    setFailed(false);
    catalog
      .listInquiries()
      .then(setItems)
      .catch((error) => {
        console.error("[Inquiries]", error);
        setFailed(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(load, [load]);

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { all: items?.length ?? 0, جديد: 0, "تم التواصل": 0, مغلق: 0 };
    for (const item of items ?? []) result[item.status] += 1;
    return result;
  }, [items]);

  if (failed) return <LoadError onRetry={load} />;
  if (!items) {
    return (
      <div className="adm-loading" aria-busy="true">
        <span className="skeleton-line" />
        <span className="skeleton-line skeleton-line--mid" />
      </div>
    );
  }

  const setStatus = async (item: Inquiry, status: InquiryStatus) => {
    try {
      await catalog.setInquiryStatus(item.id, status);
      setItems((list) => list!.map((entry) => (entry.id === item.id ? { ...entry, status } : entry)));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const list = items.filter((item) => filter === "all" || item.status === filter);
  const digits = (phone: string) => phone.replace(/\D/g, "");

  return (
    <>
      <div className="adm-toolbar">
        <div className="adm-chips" role="group" aria-label="فلترة بالحالة">
          {(["all", ...INQUIRY_STATUSES] as Filter[]).map((key) => (
            <button key={key} type="button" className={filter === key ? "active" : ""} aria-pressed={filter === key} onClick={() => setFilter(key)}>
              {key === "all" ? "الكل" : key} <b>{counts[key]}</b>
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="adm-empty">
          <p>{items.length === 0 ? "ما وصل أي طلب بعد. الطلبات من صفحة «تواصل معنا» بتطلع هون." : "ما في طلبات بهالحالة."}</p>
        </div>
      ) : (
        <ul className="adm-list">
          {list.map((item) => (
            <li key={item.id} className={`adm-inquiry ${item.status === "جديد" ? "is-new" : ""}`}>
              <div className="adm-inquiry__head">
                <strong>{item.name}</strong>
                <time dateTime={item.created_at}>{dateFormat.format(new Date(item.created_at))}</time>
              </div>
              <p className="adm-inquiry__meta">
                <bdi dir="ltr">{item.phone}</bdi>
                {item.rental_term && ` · ${item.rental_term}`}
                {item.city && ` · ${item.city}`}
                {item.property_code && (
                  <>
                    {" · "}
                    <bdi dir="ltr">{item.property_code}</bdi>
                  </>
                )}
              </p>
              {item.message && <p className="adm-inquiry__message">{item.message}</p>}
              <div className="adm-chips" role="radiogroup" aria-label={`حالة طلب ${item.name}`}>
                {INQUIRY_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    role="radio"
                    aria-checked={item.status === status}
                    className={item.status === status ? "active" : ""}
                    onClick={() => item.status !== status && setStatus(item, status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="adm-inquiry__actions">
                <a className="adm-button" href={`tel:+${digits(item.phone)}`}>
                  <Phone size={17} /> اتصال
                </a>
                <a className="adm-button" href={`https://wa.me/${digits(item.phone)}`} target="_blank" rel="noreferrer">
                  <MessageCircle size={17} /> واتساب
                </a>
                <button type="button" className="adm-button adm-button--danger" onClick={() => setConfirmDelete(item)}>
                  <Trash2 size={17} /> حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="حذف الطلب؟"
        body={`طلب «${confirmDelete?.name ?? ""}» رح ينحذف نهائياً.`}
        confirmLabel="حذف"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          const target = confirmDelete!;
          setConfirmDelete(null);
          try {
            await catalog.deleteInquiry(target.id);
            setItems((list) => list!.filter((entry) => entry.id !== target.id));
            toast.success("انحذف الطلب");
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </>
  );
}
