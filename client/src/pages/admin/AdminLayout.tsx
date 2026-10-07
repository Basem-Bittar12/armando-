import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Bell,
  Building2,
  ExternalLink,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { adminAccount } from "@/data/admin";
import { demoNotice, pageMeta } from "@/config/site";
import { useDemoStore } from "@/store/DemoStore";
import { useMeta } from "@/hooks/useMeta";
import Logo from "@/components/site/Logo";
import PropertyFormModal from "@/components/admin/PropertyFormModal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import type { Property } from "@/data/properties";

type AdminUI = {
  openAddProperty: () => void;
  openEditProperty: (property: Property) => void;
};

const AdminUIContext = createContext<AdminUI | null>(null);

export function useAdminUI() {
  const context = useContext(AdminUIContext);
  if (!context) throw new Error("useAdminUI must be used inside <AdminLayout>");
  return context;
}

export function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  useMeta({ ...pageMeta.admin, noIndex: true });
  const [location, navigate] = useLocation();
  const { properties, inquiries, notifications, unreadCount, markNotificationsRead } = useDemoStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const newInquiries = inquiries.filter((inquiry) => inquiry.status === "جديد").length;

  useEffect(() => {
    setSidebarOpen(false);
    setBellOpen(false);
  }, [location]);

  useEffect(() => {
    if (!bellOpen) return;
    const onClick = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [bellOpen]);

  const nav = [
    { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard, badge: null as string | null },
    { href: "/admin/properties", label: "العقارات", icon: Building2, badge: String(properties.length) },
    {
      href: "/admin/inquiries",
      label: "الاستفسارات",
      icon: MessageCircle,
      badge: newInquiries ? String(newInquiries) : null,
      highlight: true,
    },
    { href: "/admin/media", label: "مكتبة الصور", icon: ImagePlus, badge: null },
  ];

  const managementNav = [
    { href: "/admin/settings", label: "إعدادات الموقع", icon: Settings },
    { href: "/admin/users", label: "المستخدمون", icon: Users },
  ];

  const contextValue: AdminUI = {
    openAddProperty: () => {
      setEditing(null);
      setModalOpen(true);
    },
    openEditProperty: (property) => {
      setEditing(property);
      setModalOpen(true);
    },
  };

  return (
    <AdminUIContext.Provider value={contextValue}>
      <div className="admin-shell" dir="rtl">
        <aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`}>
          <div className="admin-sidebar__brand">
            <Logo variant="monogram-inverse" />
            <button
              className="icon-circle admin-sidebar__close"
              onClick={() => setSidebarOpen(false)}
              aria-label="إغلاق القائمة"
            >
              <X size={17} />
            </button>
          </div>

          {/* بطاقة الحساب — بدون قائمة منسدلة لأن تسجيل الدخول خارج نطاق الديمو */}
          <div className="admin-profile">
            <div className="avatar">{adminAccount.initials}</div>
            <div>
              <strong>{adminAccount.name}</strong>
              <span>{adminAccount.role}</span>
            </div>
          </div>

          <nav className="admin-nav">
            <span className="admin-nav-label">WORKSPACE</span>
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={location === item.href ? "active" : ""}>
                <item.icon size={17} />
                {item.label}
                {item.badge && <b className={item.highlight ? "admin-badge" : ""}>{item.badge}</b>}
              </Link>
            ))}

            <span className="admin-nav-label">MANAGEMENT</span>
            {managementNav.map((item) => (
              <Link key={item.href} href={item.href} className={location === item.href ? "active" : ""}>
                <item.icon size={17} />
                {item.label}
                <b className="soon-tag">قريباً</b>
              </Link>
            ))}
          </nav>

          <div className="admin-sidebar__bottom">
            <Link href="/">
              <ExternalLink size={16} /> معاينة الموقع
            </Link>
            <button onClick={() => setLogoutOpen(true)}>
              <LogOut size={16} /> تسجيل الخروج
            </button>
          </div>
        </aside>

        {sidebarOpen && <button className="admin-sidebar__backdrop" onClick={() => setSidebarOpen(false)} aria-label="إغلاق القائمة" />}

        <main className="admin-main">
          <header className="admin-topbar">
            <div className="admin-topbar__title">
              <button
                className="icon-circle admin-burger"
                onClick={() => setSidebarOpen(true)}
                aria-label="فتح القائمة"
              >
                <Menu size={18} />
              </button>
              <div>
                <span className="eyebrow">ARMANDO ALKADI / ADMIN</span>
                <h1>{title}</h1>
              </div>
            </div>

            <div className="admin-topbar__actions">
              {demoNotice.enabled && <span className="demo-chip">{demoNotice.text}</span>}

              <div className="bell-menu" ref={bellRef}>
                <button
                  className="icon-circle"
                  onClick={() => {
                    setBellOpen((open) => !open);
                    if (!bellOpen) markNotificationsRead();
                  }}
                  aria-label={`الإشعارات (${unreadCount})`}
                  aria-expanded={bellOpen}
                >
                  <Bell size={17} />
                  {unreadCount > 0 && <i className="bell-dot" />}
                </button>
                {bellOpen && (
                  <div className="bell-dropdown">
                    <div className="bell-dropdown__head">
                      <strong>الإشعارات</strong>
                      <span>{notifications.length}</span>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="bell-empty">لا توجد إشعارات</p>
                    ) : (
                      notifications.slice(0, 6).map((item) => (
                        <div key={item.id} className="bell-item">
                          <strong>{item.title}</strong>
                          <span>{item.detail}</span>
                          <small>{item.time}</small>
                        </div>
                      ))
                    )}
                    <Link href="/admin/inquiries" className="bell-dropdown__foot">
                      عرض كل الاستفسارات
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/" className="admin-preview">
                عرض الموقع <ExternalLink size={14} />
              </Link>
              <div className="avatar avatar--small">{adminAccount.initials}</div>
            </div>
          </header>

          {children}
        </main>

        <PropertyFormModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />

        <ConfirmDialog
          open={logoutOpen}
          tone="neutral"
          title="تسجيل الخروج"
          body="لا يوجد نظام تسجيل دخول حقيقي في هذه النسخة التجريبية. سيعيدك هذا الإجراء إلى الموقع العام فقط."
          confirmLabel="العودة إلى الموقع"
          onCancel={() => setLogoutOpen(false)}
          onConfirm={() => {
            setLogoutOpen(false);
            navigate("/");
            toast.info("تم الخروج من لوحة المكتب (نموذج تجريبي)");
          }}
        />
      </div>
    </AdminUIContext.Provider>
  );
}

export default AdminLayout;
