import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { statuses, type Property, type PropertyStatus } from "@/data/properties";
import { useDemoStore } from "@/store/DemoStore";
import { useAdminUI } from "@/pages/admin/AdminLayout";
import ConfirmDialog from "./ConfirmDialog";

function statusTone(status: PropertyStatus) {
  if (status === "متاح") return "green";
  if (status === "محجوز") return "gold";
  return "gray";
}

export function PropertyTable({ list }: { list: Property[] }) {
  const { updateProperty, deleteProperty } = useDemoStore();
  const { openEditProperty } = useAdminUI();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Property | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMenu]);

  if (list.length === 0) {
    return (
      <div className="empty-state empty-state--inline">
        <h3>لا توجد عقارات مطابقة</h3>
        <p>غيّر كلمة البحث أو الفلتر، أو أضف عقاراً جديداً.</p>
      </div>
    );
  }

  return (
    <>
      <div className="property-table">
        <div className="property-table__row property-table__head">
          <span>العقار</span>
          <span>الموقع</span>
          <span>السعر</span>
          <span>الحالة</span>
          <span>آخر تحديث</span>
          <span />
        </div>

        {list.map((property) => (
          <div className="property-table__row" key={property.id}>
            <div className="table-property">
              <img src={property.image} alt="" loading="lazy" />
              <div>
                <strong>{property.title}</strong>
                <small>
                  {property.id} · {property.type}
                </small>
              </div>
            </div>

            <span className="table-muted" data-label="الموقع">
              {property.location}
            </span>

            <span data-label="السعر">
              <strong>{property.price}</strong>
              <small> درهم / {property.term}</small>
            </span>

            <span data-label="الحالة">
              <label className="status-select">
                <i className={`status-dot status-dot--${statusTone(property.status)}`} />
                <select
                  value={property.status}
                  onChange={(event) => {
                    updateProperty(property.id, { status: event.target.value as PropertyStatus });
                    toast.success(`${property.id}: الحالة الآن ${event.target.value}`);
                  }}
                  aria-label={`حالة ${property.id}`}
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
            </span>

            <span className="table-muted" data-label="آخر تحديث">
              {property.updatedLabel}
            </span>

            <div className="table-actions" ref={openMenu === property.id ? menuRef : undefined}>
              <button
                className="icon-button"
                onClick={() => setOpenMenu(openMenu === property.id ? null : property.id)}
                aria-label={`إجراءات ${property.id}`}
                aria-expanded={openMenu === property.id}
              >
                <MoreHorizontal size={17} />
              </button>

              {openMenu === property.id && (
                <div className="row-menu" role="menu">
                  <Link href={`/property/${property.id}`} role="menuitem">
                    <Eye size={15} /> معاينة في الموقع
                  </Link>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setOpenMenu(null);
                      openEditProperty(property);
                    }}
                  >
                    <Pencil size={15} /> تعديل البيانات
                  </button>
                  <button
                    role="menuitem"
                    className="row-menu__danger"
                    onClick={() => {
                      setOpenMenu(null);
                      setPendingDelete(property);
                    }}
                  >
                    <Trash2 size={15} /> حذف العقار
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="حذف العقار"
        body={
          pendingDelete
            ? `سيتم حذف «${pendingDelete.title}» (${pendingDelete.id}) من المجموعة. في النسخة التجريبية يمكن استرجاعه بتحديث الصفحة.`
            : ""
        }
        confirmLabel="حذف"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteProperty(pendingDelete.id);
            toast.success(`تم حذف ${pendingDelete.id}`);
          }
          setPendingDelete(null);
        }}
      />
    </>
  );
}

export default PropertyTable;
