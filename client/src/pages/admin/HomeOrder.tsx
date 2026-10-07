import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { bySort, useCatalog } from "@/lib/catalog/store";
import AdminShell from "./AdminShell";
import { errorMessage } from "./PropertiesList";
import { SortableList } from "@/components/admin/Sortable";

/**
 * صفحة «الرئيسية»: العقارات المعروضة بشريط الرئيسية بترتيبها (ترتيب بالسحب)، وعدد العقارات بالرئيسية.
 * المؤجّر والمسودة ما بيطلعوا بالموقع حتى لو كانوا هون — مكتوب جنبهم.
 */
export default function HomeOrder() {
  return (
    <AdminShell title="الرئيسية">
      <HomeOrderBody />
    </AdminShell>
  );
}

function HomeOrderBody() {
  const catalog = useCatalog();
  const data = catalog.data!;
  const onHome = data.properties.filter((p) => p.show_on_home).sort((a, b) => a.home_order - b.home_order);
  const [count, setCount] = useState(data.settings.home_count);
  useEffect(() => setCount(data.settings.home_count), [data.settings.home_count]);

  const saveCount = async (value: number) => {
    const next = Math.min(24, Math.max(1, value));
    setCount(next);
    try {
      await catalog.setHomeCount(next);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <>
      <section className="adm-section">
        <h2>عدد العقارات بالرئيسية</h2>
        <div className="adm-count">
          <button type="button" onClick={() => saveCount(count + 1)} aria-label="زيادة العدد" disabled={count >= 24}>
            <Plus size={20} />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={24}
            value={count}
            aria-label="عدد العقارات بالرئيسية"
            onChange={(event) => setCount(Number(event.target.value) || 1)}
            onBlur={() => saveCount(count)}
          />
          <button type="button" onClick={() => saveCount(count - 1)} aria-label="إنقاص العدد" disabled={count <= 1}>
            <Minus size={20} />
          </button>
        </div>
        <p className="adm-note">
          معروض حالياً: {onHome.length} من {data.settings.home_count}.
          {onHome.length >= data.settings.home_count && " وصلت للحد — زر «اعرض بالرئيسية» متعطّل لحتى تشيل عقاراً أو تكبّر العدد."}
          {onHome.length > data.settings.home_count && ` الموقع بيعرض أول ${data.settings.home_count} بس.`}
        </p>
      </section>

      <section className="adm-section">
        <h2>الترتيب بالشريط</h2>
        {onHome.length === 0 ? (
          <p className="adm-note">
            ما في عقارات بالرئيسية. شغّل «اعرض بالرئيسية» على أي عقار من <Link href="/admin/properties">صفحة العقارات</Link>.
          </p>
        ) : (
          <>
            <p className="adm-note">اسحب من المقبض لتغيير الترتيب. الأول بيطلع أول واحد بالشريط.</p>
            <SortableList
              items={onHome}
              className="adm-order"
              itemClassName="adm-order__item"
              onReorder={(ids) => catalog.reorderHome(ids).catch((error) => toast.error(errorMessage(error)))}
              renderItem={(p, handle, index) => {
                const cover = bySort(p.images)[0];
                const hidden = !p.is_published ? "مسودة — ما بيطلع" : p.status === "مؤجر" ? "مؤجّر — ما بيطلع" : index >= data.settings.home_count ? "فوق الحد — ما بيطلع" : null;
                return (
                  <>
                    {handle}
                    <span className="adm-order__num">{index + 1}</span>
                    {cover ? <img src={cover.src_640} alt="" /> : <span className="adm-order__noimg" />}
                    <div className="adm-order__info">
                      <strong>{p.title}</strong>
                      <span>
                        <bdi dir="ltr">{p.code}</bdi>
                        {hidden && <em> · {hidden}</em>}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="adm-icon-button"
                      aria-label={`شيل ${p.title} من الرئيسية`}
                      onClick={() => catalog.setOnHome(p.id, false).catch((error) => toast.error(errorMessage(error)))}
                    >
                      <X size={18} />
                    </button>
                  </>
                );
              }}
            />
          </>
        )}
      </section>
    </>
  );
}
