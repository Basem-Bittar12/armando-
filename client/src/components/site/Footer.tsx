import { Link } from "wouter";
import { brand, contact, social, whatsappHref } from "@/config/site";
import Logo from "./Logo";
import { Address, Ltr } from "./pageContext";
import WhatsAppIcon from "./WhatsAppIcon";

/** الفوتر — عربي بالكامل على أرضية Espresso، مع الشعار الرسمي ثنائي اللغة (نسخة Inverse) */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo variant="bilingual-inverse" />
        </div>

        <div>
          <span className="footer-label">تصفّح</span>
          <Link href="/properties">العقارات</Link>
          <Link href="/properties?term=شهري">إيجار شهري</Link>
          <Link href="/properties?term=سنوي">إيجار سنوي</Link>
          <Link href="/contact">تواصل معنا</Link>
        </div>

        <div>
          <span className="footer-label">تواصل</span>
          <a href={whatsappHref()} target="_blank" rel="noreferrer" className="footer-whatsapp">
            <WhatsAppIcon size={17} /> واتساب
          </a>
          <a href={`tel:${contact.phoneHref}`}>
            <Ltr>{contact.phoneDisplay}</Ltr>
          </a>
          {contact.email && (
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          )}
          <span>
            <Address text={contact.address} />
          </span>
        </div>

        {/* يظهر عمود الحسابات فقط عند إضافة روابط حقيقية في config/site.ts */}
        {social.length > 0 && (
          <div>
            <span className="footer-label">تابعنا</span>
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
            © {year} {brand.nameAr}. جميع الحقوق محفوظة.
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
