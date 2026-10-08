import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Building2, CircleHelp, Download, ExternalLink, House, Inbox, LogOut, Menu, Phone, SlidersHorizontal } from "lucide-react";
import { pageMeta } from "@/config/site";
import { useMeta } from "@/hooks/useMeta";
import { useCatalog } from "@/lib/catalog/store";
import { LoadError } from "@/components/site/CatalogState";
import { useAuth } from "@/lib/auth";
import { downloadBackup } from "./backup";

/** القائمة الجانبية (لابتوب): كل الأقسام */
const NAV = [
  { href: "/admin/properties", label: "العقارات", icon: Building2 },
  { href: "/admin/home", label: "الرئيسية", icon: House },
  { href: "/admin/inquiries", label: "الاستفسارات", icon: Inbox },
  { href: "/admin/options", label: "الخيارات", icon: SlidersHorizontal },
  { href: "/admin/contact", label: "التواصل", icon: Phone },
  { href: "/admin/help", label: "المساعدة", icon: CircleHelp },
] as const;

/** التبويبات أسفل الشاشة (تلفون): الأكثر استعمالاً + «المزيد» للباقي */
const TABS = [
  { href: "/admin/properties", label: "العقارات", icon: Building2, also: [] as string[] },
  { href: "/admin/home", label: "الرئيسية", icon: House, also: [] as string[] },
  { href: "/admin/inquiries", label: "الاستفسارات", icon: Inbox, also: [] as string[] },
  { href: "/admin/more", label: "المزيد", icon: Menu, also: ["/admin/options", "/admin/contact", "/admin/help"] },
] as const;

/**
 * إطار لوحة التحكم — مصمم للتلفون أولاً:
 * تلفون: شريط علوي بالعنوان + تبويبات ثابتة أسفل الشاشة (بمتناول الإبهام).
 * لابتوب: قائمة جانبية يمين ومحتوى بعرض مريح.
 */
export function AdminShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  useMeta({ ...pageMeta.admin, noIndex: true });
  const [location] = useLocation();
  const { status, reload, backendKind, data } = useCatalog();
  const auth = useAuth();
  const isActive = (href: string) => location === href || location.startsWith(`${href}/`);

  return (
    <div className="adm">
      <aside className="adm-side" aria-label="أقسام اللوحة">
        <div className="adm-side__brand">
          <img src="/brand/aahh/AAHH_Monogram_Inverse_transparent.svg" alt="" width={44} height={44} />
          <span>لوحة المكتب</span>
        </div>
        <nav className="adm-side__nav">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={isActive(href) ? "active" : ""} aria-current={isActive(href) ? "page" : undefined}>
              <Icon size={20} /> {label}
            </Link>
          ))}
        </nav>
        <a className="adm-side__site" href="/" target="_blank" rel="noreferrer">
          <ExternalLink size={18} /> عرض الموقع
        </a>
        <button type="button" className="adm-side__logout" onClick={() => data && downloadBackup(data)} disabled={!data}>
          <Download size={18} /> نسخة احتياطية
        </button>
        {auth.status === "admin" && (
          <button type="button" className="adm-side__logout" onClick={() => auth.signOut()} title={auth.email}>
            <LogOut size={18} /> خروج
          </button>
        )}
      </aside>

      <div className="adm-main">
        <header className="adm-top">
          <h1>{title}</h1>
          <div className="adm-top__actions">
            {actions}
            <a className="adm-icon-link adm-top__site" href="/" target="_blank" rel="noreferrer" aria-label="عرض الموقع">
              <ExternalLink size={20} />
            </a>
          </div>
        </header>

        {backendKind === "local" && (
          <p className="adm-demo-note">
            وضع تجريبي (Supabase غير مربوط): التعديلات تظهر بالموقع فوراً، لكنها تُنسى عند تحديث الصفحة.
          </p>
        )}

        <main className="adm-content">
          {status === "loading" && (
            <div className="adm-loading" aria-busy="true">
              <span className="skeleton-line" />
              <span className="skeleton-line skeleton-line--mid" />
              <span className="skeleton-line skeleton-line--short" />
            </div>
          )}
          {status === "error" && <LoadError onRetry={reload} />}
          {status === "ready" && children}
        </main>
      </div>

      <nav className="adm-tabs" aria-label="أقسام اللوحة">
        {TABS.map(({ href, label, icon: Icon, also }) => {
          const active = isActive(href) || also.some(isActive);
          return (
            <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default AdminShell;
