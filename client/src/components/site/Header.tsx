import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "wouter";
import { ChevronDown, Heart, Menu, Phone, X } from "lucide-react";
import { toast } from "sonner";
import { englishReady, mainNav } from "@/config/site";
import { useSiteContact } from "@/hooks/useSiteContact";
import { useFavorites } from "@/store/Favorites";
import Logo from "./Logo";
import WhatsAppButton from "./WhatsAppButton";
import { Ltr } from "./pageContext";

/** يحدد ما إذا كان رابط القائمة مطابقاً للمسار الحالي (رابط بفلتر يطابق قيمة الفلتر نفسها) */
function isActive(href: string, pathname: string, params: URLSearchParams) {
  const [path, query] = href.split("?");
  if (path !== pathname) return false;
  if (!query) return true;
  const [key, value] = query.split("=");
  return params.get(key) === value;
}

const englishSoon = () => toast.info("النسخة الإنجليزية قيد الإعداد وستتوفر قريباً");

/**
 * الهيدر — موبايل: المونوغرام يميناً وزر القائمة يساراً فقط (44×44)، واللغة والمفضلة داخل القائمة.
 * لابتوب: الشعار، ثلاثة روابط (15px بمسافة 32px)، المفضلة واللغة، وزر واتساب معبّأ 40px بأقصى اليسار.
 */
export function Header() {
  const [location] = useLocation();
  const contact = useSiteContact();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const { favorites } = useFavorites();
  const langRef = useRef<HTMLDivElement>(null);
  const [params] = useSearchParams();

  // تصغير الهيدر بعد بدء التمرير. عتبتان مختلفتان تمنعان التذبذب عند الحد الفاصل
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setCondensed((current) => (current ? y > 16 : y > 40));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // إغلاق القائمة عند تغيّر الصفحة
  useEffect(() => {
    setMenuOpen(false);
    setLangOpen(false);
  }, [location]);

  // منع تمرير الصفحة خلف القائمة المفتوحة + الإغلاق بمفتاح Escape
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setLangOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // إغلاق قائمة اللغة عند الضغط خارجها
  useEffect(() => {
    if (!langOpen) return;
    const onClick = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [langOpen]);

  return (
    <>
      <header className={`site-header ${condensed ? "is-condensed" : ""}`}>
        <div className="container header-inner">
          <Logo />

          <nav className="main-nav" aria-label="التنقل الرئيسي">
            {mainNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={isActive(item.href, location, params) ? "active" : ""}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link
              href="/properties?fav=1"
              className="header-fav"
              aria-label={`المفضلة (${favorites.length})`}
              title="المفضلة"
            >
              <Heart size={18} fill={favorites.length ? "currentColor" : "none"} />
              {favorites.length > 0 && <b>{favorites.length}</b>}
            </Link>

            {/* مبدّل اللغة يظهر فقط حين تجهز النسخة الإنجليزية (englishReady في config/site.ts) */}
            {englishReady && (
            <div className="language-menu" ref={langRef}>
              <button
                className="language-switch"
                onClick={() => setLangOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={langOpen}
              >
                AR <ChevronDown size={13} />
              </button>
              {langOpen && (
                <div className="language-dropdown" role="menu">
                  <button className="is-current" role="menuitem">
                    العربية <span>نشط</span>
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setLangOpen(false);
                      englishSoon();
                    }}
                  >
                    English <span className="soon-tag">قريباً</span>
                  </button>
                </div>
              )}
            </div>

            )}
            <WhatsAppButton label="واتساب" className="header-whatsapp" />
          </div>

          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="فتح القائمة"
            aria-expanded={menuOpen}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* قائمة الموبايل: الروابط، المفضلة، اللغة، والتواصل */}
      <div className={`mobile-drawer ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <button className="mobile-drawer__backdrop" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" tabIndex={-1} />
        <aside className="mobile-drawer__panel" role="dialog" aria-modal="true" aria-label="قائمة التنقل">
          <div className="mobile-drawer__head">
            <Logo />
            <button className="icon-circle" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة">
              <X size={20} />
            </button>
          </div>

          <nav className="mobile-drawer__nav">
            {mainNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={isActive(item.href, location, params) ? "active" : ""}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/properties?fav=1" className={params.get("fav") === "1" ? "active" : ""}>
              <Heart size={18} /> المفضلة {favorites.length > 0 && <b>{favorites.length}</b>}
            </Link>
          </nav>

          {englishReady && (
          <div className="mobile-drawer__language" role="group" aria-label="اللغة">
            <span>اللغة</span>
            <button className="is-current" aria-pressed="true">
              العربية
            </button>
            <button onClick={englishSoon}>
              English <span className="soon-tag">قريباً</span>
            </button>
          </div>
          )}

          <div className="mobile-drawer__contact">
            <a href={`tel:${contact.phoneHref}`}>
              <Phone size={17} /> <Ltr>{contact.phone}</Ltr>
            </a>
            {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
          </div>

          <div className="mobile-drawer__footer">
            {/* لوحة المكتب تُفتح بالرابط /admin فقط، لا رابط لها في الموقع العام */}
            <WhatsAppButton label="واتساب" />
          </div>
        </aside>
      </div>
    </>
  );
}

export default Header;
