import { useEffect, useState, type ReactNode } from "react";
import { Phone } from "lucide-react";
import { useLocation } from "wouter";
import { useSiteContact } from "@/hooks/useSiteContact";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import { WhatsAppMessageProvider } from "./pageContext";

/**
 * متى يظهر شريط الموبايل الثابت:
 * - "always": من البداية (الافتراضي)
 * - "after-hero": بعد انتهاء هيرو الرئيسية وارتفاع آخره فوق مكان الشريط (فيه زر واتساب خاص به)
 * - { showAfter, content }: بعد عدد بكسلات من التمرير، بمحتوى خاص (صفحة العقار: السعر + الزر)
 */
type MobileBar = "always" | "after-hero" | { showAfter: number; content: ReactNode };

/** شريط الموبايل الثابت: بديل فقاعة واتساب العائمة (اللابتوب لا يعرضه) */
function MobileActionBar({ mode }: { mode: MobileBar }) {
  const contact = useSiteContact();
  const [visible, setVisible] = useState(mode === "always");
  // مفتاح ثابت للتأثير: الصفحة تمرر كائناً جديداً في كل رسم
  const modeKey = typeof mode === "object" ? `after:${mode.showAfter}` : mode;

  useEffect(() => {
    if (mode === "always") return setVisible(true);
    let frame = 0;
    const update = () => {
      frame = 0;
      if (mode === "after-hero") {
        // بعد انتهاء الهيرو: حين يرتفع آخره فوق مكان الشريط (64px)، فلا يغطي الشريط صف أزرار الهيرو
        const hero = document.querySelector(".hero-canvas");
        setVisible(!hero || hero.getBoundingClientRect().bottom <= window.innerHeight - 64);
      } else {
        setVisible(window.scrollY > mode.showAfter);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- modeKey يمثّل mode
  }, [modeKey]);

  return (
    <div className={`mobile-action-bar ${visible ? "is-visible" : ""}`} inert={!visible}>
      {typeof mode === "object" ? (
        mode.content
      ) : (
        <>
          <WhatsAppButton label="واتساب" className="mobile-action-bar__primary" />
          <a href={`tel:${contact.phoneHref}`} className="outline-button mobile-action-bar__secondary">
            <Phone size={17} /> اتصال
          </a>
        </>
      )}
    </div>
  );
}

/**
 * الهيكل المشترك لكل صفحات الموقع العام: هيدر + محتوى + فوتر + شريط الموبايل.
 * whatsappMessage: رسالة واتساب الجاهزة لهذه الصفحة (الهيدر والشريط وأزرار الصفحة).
 */
export function PublicLayout({
  children,
  whatsappMessage,
  mobileBar = "always",
}: {
  children: ReactNode;
  whatsappMessage?: string;
  mobileBar?: MobileBar;
}) {
  // المفتاح = المسار فقط، فتغيير الفلاتر في الرابط لا يعيد الحركة
  const [location] = useLocation();
  return (
    <WhatsAppMessageProvider message={whatsappMessage}>
      <div className="public-shell">
        <Header />
        <main key={location} className="page-fade">
          {children}
        </main>
        <Footer />
        <MobileActionBar mode={mobileBar} />
      </div>
    </WhatsAppMessageProvider>
  );
}

export default PublicLayout;
