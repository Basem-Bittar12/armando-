import { payments } from "@/config/site";
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
  const logo = <img src={payments.tabby.logo} alt="tabby" className="tabby-badge__logo" loading="lazy" decoding="async" />;
  if (placement === "card") return <span className="tabby-badge tabby-badge--card">{logo}</span>;
  return (
    <p className={`tabby-badge tabby-badge--${placement}`}>
      <span>{placement === "footer" ? t("طرق الدفع", "Payment options") : t("متاح الدفع عبر", "Pay with")}</span>
      {logo}
    </p>
  );
}

export default TabbyBadge;
