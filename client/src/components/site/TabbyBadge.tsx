import { payments } from "@/config/site";
import { Landmark } from "lucide-react";
import { useT } from "@/i18n/lang";

/**
 * شعار tabby الرسمي (ملف كما هو، بلا رسم أو تلوين) بثلاثة أحجام:
 *  - footer: سطر «طرق الدفع» بالفوتر
 *  - detail: تحت السعر بصفحة العقار
 *  - card: شعار صغير بجانب السعر بالكرت
 * لا يظهر شيء قبل تفعيله من config/site.ts (payments.tabby).
 */
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
      <span className="tabby-badge__brand">
        {logo}
        <bdi lang="en">tabby</bdi>
      </span>
      {placement === "footer" && (
        <>
          {/* باقي طرق الدفع (طلب صاحب الموقع 10/2026) — نص بخط الموقع، بلا شعارات مرسومة */}
          <bdi lang="en" className="pay-method">Visa</bdi>
          <bdi lang="en" className="pay-method">Mastercard</bdi>
          <bdi lang="en" className="pay-method">Apple Pay</bdi>
          <span className="pay-method"><Landmark size={14} aria-hidden="true" /> {t("تحويل بنكي", "Bank transfer")}</span>
        </>
      )}
    </p>
  );
}

export default TabbyBadge;
