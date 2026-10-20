import { payments } from "@/config/site";
import { Landmark } from "lucide-react";
import { siApplepay, siMastercard, siVisa } from "simple-icons";
import { useT } from "@/i18n/lang";

/**
 * شعار tabby الرسمي (ملف كما هو، بلا رسم أو تلوين) بثلاثة أحجام:
 *  - footer: سطر «طرق الدفع» بالفوتر
 *  - detail: تحت السعر بصفحة العقار
 *  - card: شعار صغير بجانب السعر بالكرت
 * لا يظهر شيء قبل تفعيله من config/site.ts (payments.tabby).
 */
/** شعار طريقة دفع بلون واحد (لون النص) داخل كبسولة متل أيقونة tabby */
function PayIcon({ path, title, wide = false }: { path: string; title: string; wide?: boolean }) {
  return (
    <span className={`pay-method${wide ? " pay-method--wide" : ""}`} title={title}>
      <svg viewBox="0 0 24 24" role="img" aria-label={title} fill="currentColor"><path d={path} /></svg>
    </span>
  );
}

export function TabbyBadge({ placement }: { placement: "footer" | "detail" | "card" }) {
  const t = useT();
  if (!payments.tabby.enabled) return null;
  const logo = (
    <img
      src={payments.tabby.logo}
      srcSet={`${payments.tabby.logo} 1x, ${payments.tabby.logo2x} 2x`}
      alt={placement === "card" ? "tabby" : ""}
      className="tabby-badge__logo"
      width={22}
      height={22}
      loading="lazy"
      decoding="async"
    />
  );
  if (placement === "card") return <span className="tabby-badge tabby-badge--card" title="tabby">{logo}</span>;
  return (
    <p className={`tabby-badge tabby-badge--${placement}`}>
      <span>{placement === "footer" ? t("طرق الدفع", "Payment options") : t("متاح الدفع عبر", "Pay with")}</span>
      {placement === "footer" ? (
        <>
          {/* كل طرق الدفع بنفس المربّع (طلب صاحب الموقع 10/2026): شعار فقط، والاسم للتلميح وقارئ الشاشة.
              Visa/Mastercard/Apple Pay من Simple Icons (CC0) بلون الفوتر؛ tabby أيقونتها الرسمية كما هي */}
          <span className="pay-method" title="tabby">
            {logo}
            <span className="sr-only">tabby</span>
          </span>
          <PayIcon path={siVisa.path} title="Visa" />
          <PayIcon path={siMastercard.path} title="Mastercard" />
          <PayIcon path={siApplepay.path} title="Apple Pay" wide />
          <span className="pay-method" title={t("تحويل بنكي", "Bank transfer")}>
            <Landmark aria-hidden="true" />
            <span className="sr-only">{t("تحويل بنكي", "Bank transfer")}</span>
          </span>
        </>
      ) : (
        <span className="tabby-badge__brand">
          {logo}
          <bdi lang="en">tabby</bdi>
        </span>
      )}
    </p>
  );
}

export default TabbyBadge;
