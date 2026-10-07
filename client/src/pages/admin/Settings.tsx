import { brand, contact, social } from "@/config/site";
import AdminLayout from "./AdminLayout";
import ScopeNotice from "@/components/admin/ScopeNotice";

/**
 * صفحة الإعدادات تعرض البيانات الحالية كما هي في client/src/config/site.ts
 * التعديل من الواجهة يحتاج باك اند — لذلك الحقول للعرض فقط في هذه المرحلة.
 */
function SettingsContent() {
  const fields = [
    { label: "الاسم الرسمي", value: brand.nameAr },
    { label: "الاسم بالإنجليزي", value: brand.name },
    { label: "رقم الهاتف", value: contact.phoneDisplay },
    { label: "رقم واتساب", value: `+${contact.whatsapp}` },
    { label: "البريد الإلكتروني", value: contact.email },
    { label: "العنوان", value: contact.address },
    { label: "ساعات العمل", value: contact.hours },
  ];

  return (
    <div className="admin-content">
      <div className="properties-admin-heading">
        <div>
          <span className="eyebrow">SITE SETTINGS</span>
          <h2>إعدادات الموقع</h2>
          <p>البيانات العامة التي تظهر في الهيدر والفوتر وصفحة التواصل.</p>
        </div>
      </div>

      <ScopeNotice
        title="تعديل البيانات من اللوحة"
        body="لتعديل هذه البيانات من هنا نحتاج باك اند يحفظ الإعدادات. حالياً يتم تغييرها مباشرة من ملف واحد: client/src/config/site.ts — والتغيير يظهر فوراً في كل صفحات الموقع."
      />

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">GENERAL</span>
            <h3>البيانات الأساسية</h3>
          </div>
        </div>
        <div className="settings-grid">
          {fields.map((field) => (
            <label key={field.label}>
              {field.label}
              {/* null = لم تصل البيانات الحقيقية بعد، فالحقل مخفي في الموقع العام */}
              <input value={field.value ?? ""} placeholder="لم يُضف بعد — مخفي في الموقع" readOnly />
            </label>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">SOCIAL</span>
            <h3>روابط التواصل الاجتماعي</h3>
          </div>
        </div>
        {social.length === 0 && (
          <p className="settings-empty">لا توجد روابط بعد — عمود الحسابات مخفي في الفوتر حتى تُضاف روابط حقيقية.</p>
        )}
        <div className="settings-grid">
          {social.map((item) => (
            <label key={item.label}>
              {item.label}
              <input value={item.href} readOnly />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Settings() {
  return (
    <AdminLayout title="إعدادات الموقع">
      <SettingsContent />
    </AdminLayout>
  );
}
