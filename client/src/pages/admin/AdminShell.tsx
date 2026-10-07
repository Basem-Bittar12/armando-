import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Building2, ExternalLink, House, SlidersHorizontal } from "lucide-react";
import { pageMeta } from "@/config/site";
import { useMeta } from "@/hooks/useMeta";
import { useCatalog } from "@/lib/catalog/store";
import { LoadError } from "@/components/site/CatalogState";

const NAV = [
  { href: "/admin/properties", label: "العقارات", icon: Building2 },
  { href: "/admin/home", label: "الرئيسية", icon: House },
  { href: "/admin/options", label: "الخيارات", icon: SlidersHorizontal },
] as const;

/**
 * إطار لوحة التحكم — مصمم للتلفون أولاً:
 * تلفون: شريط علوي بالعنوان + تبويبات ثابتة أسفل الشاشة (بمتناول الإبهام).
 * لابتوب: قائمة جانبية يمين ومحتوى بعرض مريح.
 */
export function AdminShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  useMeta({ ...pageMeta.admin, noIndex: true });
  const [location] = useLocation();
  const { status, reload, backendKind } = useCatalog();
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
            وضع تجريبي: التعديلات تظهر بالموقع فوراً، لكنها تُنسى عند تحديث الصفحة — تُحفظ فعلياً بعد ربط Supabase.
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
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={isActive(href) ? "active" : ""} aria-current={isActive(href) ? "page" : undefined}>
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default AdminShell;
