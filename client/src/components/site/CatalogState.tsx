import { RotateCcw } from "lucide-react";
import WhatsAppButton from "./WhatsAppButton";
import { useT } from "@/i18n/lang";

/** هيكل تحميل بنفس أحجام كروت العقارات (ألوان الباليت فقط) */
export function CardSkeletons({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div className="property-card skeleton-card" key={i} aria-hidden="true">
          <div className="property-card__image-wrap skeleton-block" />
          <div className="property-card__body">
            <span className="skeleton-line skeleton-line--short" />
            <span className="skeleton-line" />
            <span className="skeleton-line skeleton-line--mid" />
            <span className="skeleton-line skeleton-line--short" />
          </div>
        </div>
      ))}
    </>
  );
}

/** حالة خطأ التحميل: إعادة المحاولة + واتساب */
export function LoadError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <div className="empty-state load-error" role="alert">
      <h3>{t("تعذّر تحميل البيوت", "We couldn't load the homes")}</h3>
      <p>{t("تحقق من الاتصال بالإنترنت وأعد المحاولة، أو اسألنا مباشرة عبر واتساب.", "Check your internet connection and try again, or ask us directly on WhatsApp.")}</p>
      <div className="empty-state__actions">
        <button className="outline-button" onClick={onRetry}>
          <RotateCcw size={16} /> {t("إعادة المحاولة", "Try again")}
        </button>
        <WhatsAppButton label={t("اسألنا عبر واتساب", "Ask us on WhatsApp")} />
      </div>
    </div>
  );
}
