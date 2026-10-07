import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Check, ExternalLink, MessageCircle, Phone, Search } from "lucide-react";
import { toast } from "sonner";
import { contact } from "@/config/site";
import { useDemoStore } from "@/store/DemoStore";
import type { InquiryStatus } from "@/data/admin";
import AdminLayout from "./AdminLayout";

const statusFilters: (InquiryStatus | "الكل")[] = ["الكل", "جديد", "تمت المتابعة", "مغلق"];

const statusTone: Record<InquiryStatus, string> = {
  جديد: "green",
  "تمت المتابعة": "gold",
  مغلق: "gray",
};

function InquiriesContent() {
  const { inquiries, setInquiryStatus, getProperty } = useDemoStore();
  const [filter, setFilter] = useState<InquiryStatus | "الكل">("الكل");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(inquiries[0]?.id ?? null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return inquiries.filter((inquiry) => {
      if (filter !== "الكل" && inquiry.status !== filter) return false;
      if (!needle) return true;
      return `${inquiry.name} ${inquiry.phone} ${inquiry.message} ${inquiry.propertyId ?? ""}`
        .toLowerCase()
        .includes(needle);
    });
  }, [inquiries, filter, query]);

  const active = inquiries.find((inquiry) => inquiry.id === selected) ?? filtered[0] ?? null;
  const activeProperty = active?.propertyId ? getProperty(active.propertyId) : undefined;

  return (
    <div className="admin-content">
      <div className="properties-admin-heading">
        <div>
          <span className="eyebrow">CLIENT INQUIRIES / {inquiries.length}</span>
          <h2>الاستفسارات</h2>
          <p>كل ما يصلك من الموقع وواتساب والاتصالات في مكان واحد.</p>
        </div>
      </div>

      <div className="admin-filters">
        <div className="toolbar-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث باسم العميل أو رقمه أو كود العقار"
            aria-label="بحث في الاستفسارات"
          />
        </div>
        <div className="filter-pills filter-pills--admin">
          {statusFilters.map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
              {item !== "الكل" && (
                <b>{inquiries.filter((inquiry) => inquiry.status === item).length}</b>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="inquiry-layout">
        <section className="admin-panel inquiry-list">
          {filtered.length === 0 ? (
            <div className="empty-state empty-state--inline">
              <h3>لا توجد استفسارات مطابقة</h3>
              <p>جرّب تغيير الفلتر أو كلمة البحث.</p>
            </div>
          ) : (
            filtered.map((inquiry) => (
              <button
                key={inquiry.id}
                className={`inquiry-row ${active?.id === inquiry.id ? "is-active" : ""}`}
                onClick={() => setSelected(inquiry.id)}
              >
                <div className="inquiry-row__top">
                  <strong>{inquiry.name}</strong>
                  <small>{inquiry.receivedAt}</small>
                </div>
                <p>{inquiry.message}</p>
                <div className="inquiry-row__meta">
                  <span className="chip chip--light">{inquiry.channel}</span>
                  {inquiry.propertyId && <span className="inquiry-row__id">{inquiry.propertyId}</span>}
                  <span className="inquiry-row__status">
                    <i className={`status-dot status-dot--${statusTone[inquiry.status]}`} />
                    {inquiry.status}
                  </span>
                </div>
              </button>
            ))
          )}
        </section>

        <section className="admin-panel inquiry-detail">
          {active ? (
            <>
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">{active.id}</span>
                  <h3>{active.name}</h3>
                </div>
                <span className="inquiry-row__status">
                  <i className={`status-dot status-dot--${statusTone[active.status]}`} />
                  {active.status}
                </span>
              </div>

              <dl className="detail-table detail-table--compact">
                <div>
                  <dt>رقم الهاتف</dt>
                  <dd>{active.phone}</dd>
                </div>
                <div>
                  <dt>القناة</dt>
                  <dd>{active.channel}</dd>
                </div>
                <div>
                  <dt>وصل</dt>
                  <dd>{active.receivedAt}</dd>
                </div>
                <div>
                  <dt>العقار</dt>
                  <dd>
                    {activeProperty ? (
                      <Link href={`/property/${activeProperty.id}`} className="text-button">
                        {activeProperty.title} <ExternalLink size={13} />
                      </Link>
                    ) : (
                      "استفسار عام"
                    )}
                  </dd>
                </div>
              </dl>

              <div className="inquiry-message">{active.message}</div>

              <div className="inquiry-actions">
                <a
                  href={`https://wa.me/${active.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="whatsapp-button"
                >
                  <MessageCircle size={16} /> الرد عبر واتساب
                </a>
                <a href={`tel:${active.phone.replace(/\s/g, "")}`} className="outline-button">
                  <Phone size={15} /> اتصال
                </a>
                {active.status !== "تمت المتابعة" && (
                  <button
                    className="outline-button"
                    onClick={() => {
                      setInquiryStatus(active.id, "تمت المتابعة");
                      toast.success(`${active.id}: تم وضع علامة متابعة`);
                    }}
                  >
                    <Check size={15} /> تمت المتابعة
                  </button>
                )}
                {active.status !== "مغلق" && (
                  <button
                    className="text-button"
                    onClick={() => {
                      setInquiryStatus(active.id, "مغلق");
                      toast.success(`${active.id}: تم إغلاق الاستفسار`);
                    }}
                  >
                    إغلاق الاستفسار
                  </button>
                )}
              </div>

              <p className="inquiry-note">
                الردود تتم حالياً من تطبيق واتساب أو الهاتف مباشرة. ربط صندوق رد داخلي يحتاج باك اند
                وواجهة WhatsApp Business API — راجع خطة الإنتاج. رقم المكتب: {contact.phoneDisplay}
              </p>
            </>
          ) : (
            <div className="empty-state empty-state--inline">
              <h3>اختر استفساراً لعرض تفاصيله</h3>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function Inquiries() {
  return (
    <AdminLayout title="الاستفسارات">
      <InquiriesContent />
    </AdminLayout>
  );
}
