import { adminAccount } from "@/data/admin";
import AdminLayout from "./AdminLayout";
import ScopeNotice from "@/components/admin/ScopeNotice";

/** فريق المكتب — بيانات عرض فقط، تحتاج نظام صلاحيات وتسجيل دخول حقيقي */
const team = [
  { name: adminAccount.name, email: "admin@armandoalkadi.ae", role: "مدير النظام", initials: "AK" },
  { name: "ليلى الحمادي", email: "laila@armandoalkadi.ae", role: "مستشارة عقارية", initials: "LH" },
  { name: "يوسف قاسم", email: "yousef@armandoalkadi.ae", role: "مستشار عقاري", initials: "YQ" },
  { name: "Front Desk", email: "reception@armandoalkadi.ae", role: "استقبال", initials: "FD" },
];

function UsersContent() {
  return (
    <div className="admin-content">
      <div className="properties-admin-heading">
        <div>
          <span className="eyebrow">TEAM / {team.length}</span>
          <h2>المستخدمون</h2>
          <p>فريق المكتب وصلاحيات الوصول إلى اللوحة.</p>
        </div>
      </div>

      <ScopeNotice
        title="إدارة المستخدمين والصلاحيات"
        body="إضافة مستخدمين وتحديد صلاحياتهم تحتاج نظام تسجيل دخول حقيقي (Auth) وقاعدة بيانات. البيانات أدناه للعرض فقط وتوضّح شكل الصفحة بعد الربط."
      />

      <section className="admin-panel">
        <div className="users-table">
          <div className="users-table__row users-table__head">
            <span>المستخدم</span>
            <span>البريد الإلكتروني</span>
            <span>الصلاحية</span>
            <span>الحالة</span>
          </div>
          {team.map((member) => (
            <div className="users-table__row" key={member.email}>
              <div className="table-property">
                <div className="avatar avatar--small">{member.initials}</div>
                <div>
                  <strong>{member.name}</strong>
                </div>
              </div>
              <span className="table-muted" data-label="البريد الإلكتروني">
                {member.email}
              </span>
              <span data-label="الصلاحية">{member.role}</span>
              <span data-label="الحالة">
                <i className="status-dot status-dot--green" /> نشط
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function UsersPage() {
  return (
    <AdminLayout title="المستخدمون">
      <UsersContent />
    </AdminLayout>
  );
}
