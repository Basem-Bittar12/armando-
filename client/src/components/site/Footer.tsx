import { Link } from "wouter";
import { brand } from "@/config/site";
import { useSiteContact } from "@/hooks/useSiteContact";
import { pickLang, useLang, useT } from "@/i18n/lang";
import { bySort, useCatalog } from "@/lib/catalog/store";
import Logo from "./Logo";
import { Address, Ltr } from "./pageContext";
import WhatsAppIcon from "./WhatsAppIcon";

/** الفوتر — عربي بالكامل على أرضية Espresso، مع الشعار الرسمي ثنائي اللغة (نسخة Inverse) */
export function Footer() {
  const year = new Date().getFullYear();
  const contact = useSiteContact();
  const lang = useLang();
  const t = useT();
  const { data } = useCatalog();
  // روابط أنواع الإيجار من البيانات (المفعّل) — قيمة الفلتر هي الاسم بلغة الصفحة
  const terms = data
    ? bySort(data.rental_terms.filter((term) => term.is_active)).map((term) => pickLang(lang, term.name_ar, term.name_en))
    : lang === "en"
      ? ["Monthly", "Yearly"]
      : ["شهري", "سنوي"];
  const { social, whatsappHref } = contact;

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo variant="bilingual-inverse" />
        </div>

        <div>
          <span className="footer-label">{t("تصفّح", "Browse")}</span>
          <Link href="/properties">{t("العقارات", "Properties")}</Link>
          {terms.map((term) => (
            <Link key={term} href={`/properties?term=${encodeURIComponent(term)}`}>
              {lang === "en" ? `${term} rental` : `إيجار ${term}`}
            </Link>
          ))}
          <Link href="/contact">{t("تواصل معنا", "Contact us")}</Link>
        </div>

        <div>
          <span className="footer-label">{t("تواصل", "Contact")}</span>
          <a href={whatsappHref()} target="_blank" rel="noreferrer" className="footer-whatsapp">
            <WhatsAppIcon size={17} /> {t("واتساب", "WhatsApp")}
          </a>
          <a href={`tel:${contact.phoneHref}`}>
            <Ltr>{contact.phone}</Ltr>
          </a>
          {contact.email && (
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          )}
          <span className="footer-address">
            <Address text={contact.address} />
          </span>
        </div>

        {/* يظهر عمود الحسابات فقط عند إضافة روابط حقيقية من اللوحة (صفحة «التواصل») */}
        {social.length > 0 && (
          <div>
            <span className="footer-label">{t("تابعنا", "Follow us")}</span>
            {social.map(item => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="container">
        <div className="footer-bottom">
          <span>
            {t(`© ${year} ${brand.nameAr}. جميع الحقوق محفوظة.`, `© ${year} ${brand.name}. All rights reserved.`)}
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
