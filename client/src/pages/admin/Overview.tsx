import { Link } from "wouter";
import {
  ArrowLeft,
  Building2,
  ChevronLeft,
  Eye,
  ImagePlus,
  MessageCircle,
  Pencil,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { activity, overviewStats, welcomeDate } from "@/data/admin";
import { useDemoStore } from "@/store/DemoStore";
import AdminLayout, { useAdminUI } from "./AdminLayout";
import PropertyTable from "@/components/admin/PropertyTable";

const activityIcon = {
  add: { className: "activity-icon--gold", Icon: Plus },
  inquiry: { className: "activity-icon--green", Icon: MessageCircle },
  edit: { className: "activity-icon--blue", Icon: Pencil },
} as const;

function OverviewContent() {
  const { openAddProperty } = useAdminUI();
  const { properties, inquiries } = useDemoStore();

  const available = properties.filter((property) => property.status === "متاح").length;
  const newInquiries = inquiries.filter((inquiry) => inquiry.status === "جديد").length;

  return (
    <div className="admin-content">
      <div className="admin-welcome-card">
        <div>
          <span className="eyebrow eyebrow--light">{welcomeDate}</span>
          <h2>كل التفاصيل في مكان واحد.</h2>
          <p>تابع عقاراتك واستفسارات العملاء وحدّث المجموعة بسهولة.</p>
        </div>
        <button className="primary-button" onClick={openAddProperty}>
          <Plus size={17} /> إضافة عقار جديد
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__top">
            <span>إجمالي العقارات</span>
            <Building2 size={18} />
          </div>
          <strong>{properties.length}</strong>
          <small className="positive">{overviewStats.addedThisMonth}</small>
        </div>
        <div className="stat-card">
          <div className="stat-card__top">
            <span>متاح حالياً</span>
            <Eye size={18} />
          </div>
          <strong>{available}</strong>
          <small>من أصل {properties.length} عقار</small>
        </div>
        <div className="stat-card">
          <div className="stat-card__top">
            <span>الاستفسارات</span>
            <MessageCircle size={18} />
          </div>
          <strong>{overviewStats.inquiriesTotal}</strong>
          <small className="positive">{overviewStats.inquiriesDelta}</small>
        </div>
        <div className="stat-card">
          <div className="stat-card__top">
            <span>مشاهدات الموقع</span>
            <Users size={18} />
          </div>
          <strong>{overviewStats.visitsTotal}</strong>
          <small className="positive">{overviewStats.visitsDelta}</small>
        </div>
      </div>

      <div className="admin-grid-main">
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">RECENT ACTIVITY</span>
              <h3>آخر التحديثات</h3>
            </div>
            <Link href="/admin/properties" className="text-button">
              عرض الكل <ArrowLeft size={15} />
            </Link>
          </div>
          <div className="activity-list">
            {activity.map((item) => {
              const { className, Icon } = activityIcon[item.kind];
              return (
                <div key={item.id}>
                  <span className={`activity-icon ${className}`}>
                    <Icon size={15} />
                  </span>
                  <p>
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </p>
                  <small>{item.time}</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="admin-panel quick-actions">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">QUICK ACCESS</span>
              <h3>إجراءات سريعة</h3>
            </div>
          </div>
          <button onClick={openAddProperty}>
            <span>
              <Plus size={17} />
            </span>
            <div>
              <strong>إضافة عقار</strong>
              <small>أنشئ صفحة عقار جديدة</small>
            </div>
            <ChevronLeft size={17} />
          </button>
          <Link href="/admin/inquiries">
            <span>
              <MessageCircle size={17} />
            </span>
            <div>
              <strong>الاستفسارات</strong>
              <small>{newInquiries} استفسار جديد بانتظار الرد</small>
            </div>
            <ChevronLeft size={17} />
          </Link>
          <Link href="/admin/media">
            <span>
              <ImagePlus size={17} />
            </span>
            <div>
              <strong>مكتبة الصور</strong>
              <small>تصفح صور العقارات</small>
            </div>
            <ChevronLeft size={17} />
          </Link>
          <Link href="/admin/settings">
            <span>
              <Settings size={17} />
            </span>
            <div>
              <strong>إعدادات الموقع</strong>
              <small>البيانات العامة والتواصل</small>
            </div>
            <ChevronLeft size={17} />
          </Link>
        </section>
      </div>

      <section className="admin-panel table-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">PROPERTY COLLECTION</span>
            <h3>العقارات المضافة حديثاً</h3>
          </div>
          <Link href="/admin/properties" className="outline-button">
            إدارة العقارات <ArrowLeft size={15} />
          </Link>
        </div>
        <PropertyTable list={properties.slice(0, 4)} />
      </section>
    </div>
  );
}

export default function Overview() {
  return (
    <AdminLayout title="صباح الخير، Armando">
      <OverviewContent />
    </AdminLayout>
  );
}
