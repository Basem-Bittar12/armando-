import { useMemo, useState } from "react";
import { ListFilter, Plus, RotateCcw, Search } from "lucide-react";
import { propertyTypes, statuses, type PropertyStatus, type PropertyType } from "@/data/properties";
import { useDemoStore } from "@/store/DemoStore";
import AdminLayout, { useAdminUI } from "./AdminLayout";
import PropertyTable from "@/components/admin/PropertyTable";

function PropertiesContent() {
  const { openAddProperty } = useAdminUI();
  const { properties } = useDemoStore();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PropertyStatus | "">("");
  const [type, setType] = useState<PropertyType | "">("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return properties.filter((property) => {
      if (status && property.status !== status) return false;
      if (type && property.type !== type) return false;
      if (!needle) return true;
      return `${property.title} ${property.location} ${property.id}`.toLowerCase().includes(needle);
    });
  }, [properties, query, status, type]);

  const activeFilters = (query ? 1 : 0) + (status ? 1 : 0) + (type ? 1 : 0);

  return (
    <div className="admin-content">
      <div className="properties-admin-heading">
        <div>
          <span className="eyebrow">PROPERTY COLLECTION / {properties.length}</span>
          <h2>كل العقارات</h2>
          <p>أضف وعدّل وحدث حالة العقارات من مكان واحد.</p>
        </div>
        <button className="primary-button" onClick={openAddProperty}>
          <Plus size={17} /> إضافة عقار
        </button>
      </div>

      <div className="admin-filters">
        <div className="toolbar-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث بالاسم أو المنطقة أو الكود"
            aria-label="بحث في العقارات"
          />
        </div>

        <label className="filter-button">
          <ListFilter size={16} />
          <select value={type} onChange={(event) => setType(event.target.value as PropertyType | "")} aria-label="نوع العقار">
            <option value="">كل الأنواع</option>
            {propertyTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-button">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as PropertyStatus | "")}
            aria-label="حالة العقار"
          >
            <option value="">كل الحالات</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        {activeFilters > 0 && (
          <button
            className="text-button"
            onClick={() => {
              setQuery("");
              setStatus("");
              setType("");
            }}
          >
            <RotateCcw size={15} /> إزالة الفلاتر ({activeFilters})
          </button>
        )}

        <span className="admin-filters__count">
          <strong>{filtered.length}</strong> من {properties.length}
        </span>
      </div>

      <section className="admin-panel table-panel">
        <PropertyTable list={filtered} />
      </section>
    </div>
  );
}

export default function PropertiesAdmin() {
  return (
    <AdminLayout title="إدارة العقارات">
      <PropertiesContent />
    </AdminLayout>
  );
}
