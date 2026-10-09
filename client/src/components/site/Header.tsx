import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "wouter";
import { Heart, Menu, Phone, X } from "lucide-react";
import { englishReady, mainNavFor } from "@/config/site";
import { useLang, useT } from "@/i18n/lang";
import LangSwitch from "./LangSwitch";
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

/**
 * الهيدر — موبايل: المونوغرام يميناً وزر القائمة يساراً فقط (44×44)، واللغة والمفضلة داخل القائمة.
 * لابتوب: الشعار، ثلاثة روابط (15px بمسافة 32px)، المفضلة واللغة، وزر واتساب معبّأ 40px بأقصى اليسار.
 */
export function Header() {
  const [location] = useLocation();
  const contact = useSiteContact();
  const lang = useLang();
  const t = useT();
  const mainNav = mainNavFor(lang);
  const [menuOpen, setMenuOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const { favorites } = useFavorites();
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
  }, [location]);

  // منع تمرير الصفحة خلف القائمة المفتوحة + الإغلاق بمفتاح Escape
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);


  return (
    <>
      <header className={`site-header ${condensed ? "is-condensed" : ""}`}>
        <div className="container header-inner">
          <Logo />

          <nav className="main-nav" aria-label={t("التنقل الرئيسي", "Main navigation")}>
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
              aria-label={`${t("المفضلة", "Favorites")} (${favorites.length})`}
              title={t("المفضلة", "Favorites")}
            >
              <Heart size={18} fill={favorites.length ? "currentColor" : "none"} />
              {favorites.length > 0 && <b>{favorites.length}</b>}
            </Link>

            {/* زر اللغة: EN بالعربي، عربي بالإنجليزي (englishReady في config/site.ts) */}
            {englishReady && <LangSwitch />}
            <WhatsAppButton label={t("واتساب", "WhatsApp")} className="header-whatsapp" />
          </div>

          {englishReady && <LangSwitch className="header-lang--mobile" />}
          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(true)}
            aria-label={t("فتح القائمة", "Open menu")}
            aria-expanded={menuOpen}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* قائمة الموبايل: الروابط، المفضلة، اللغة، والتواصل */}
      <div className={`mobile-drawer ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <button className="mobile-drawer__backdrop" onClick={() => setMenuOpen(false)} aria-label={t("إغلاق القائمة", "Close menu")} tabIndex={-1} />
        <aside className="mobile-drawer__panel" role="dialog" aria-modal="true" aria-label={t("قائمة التنقل", "Navigation menu")}>
          <div className="mobile-drawer__head">
            <Logo />
            <button className="icon-circle" onClick={() => setMenuOpen(false)} aria-label={t("إغلاق القائمة", "Close menu")}>
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
              <Heart size={18} /> {t("المفضلة", "Favorites")} {favorites.length > 0 && <b>{favorites.length}</b>}
            </Link>
          </nav>

          <div className="mobile-drawer__contact">
            <a href={`tel:${contact.phoneHref}`}>
              <Phone size={17} /> <Ltr>{contact.phone}</Ltr>
            </a>
            {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
          </div>

          <div className="mobile-drawer__footer">
            {/* لوحة المكتب تُفتح بالرابط /admin فقط، لا رابط لها في الموقع العام */}
            <WhatsAppButton label={t("واتساب", "WhatsApp")} />
          </div>
        </aside>
      </div>
    </>
  );
}

export default Header;
