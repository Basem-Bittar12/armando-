import { RotateCcw } from "lucide-react";
import WhatsAppButton from "./WhatsAppButton";

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
  return (
    <div className="empty-state load-error" role="alert">
      <h3>تعذّر تحميل البيوت</h3>
      <p>تحقق من الاتصال بالإنترنت وأعد المحاولة، أو اسألنا مباشرة عبر واتساب.</p>
      <div className="empty-state__actions">
        <button className="outline-button" onClick={onRetry}>
          <RotateCcw size={16} /> إعادة المحاولة
        </button>
        <WhatsAppButton label="اسألنا عبر واتساب" />
      </div>
    </div>
  );
}
