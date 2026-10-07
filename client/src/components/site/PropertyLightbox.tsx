import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { whatsappTemplates } from "@/config/site";
import type { Property } from "@/lib/catalog/view";
import { pauseScroll, resumeScroll } from "@/lib/motion";
import SwipeGallery from "./SwipeGallery";
import WhatsAppButton from "./WhatsAppButton";
import { Ltr } from "./pageContext";

/**
 * المعرض المكبّر لصور بيت: Espresso Deep كاملة، الصور بالسحب، العدّاد فوق بالمنتصف، إغلاق 44px،
 * وزر «اسأل عن هذا العقار» (+ رابط «تفاصيل البيت» حين يُفتح من خارج صفحة العقار).
 * أثناء الفتح يتوقف تمرير الصفحة؛ عند الإغلاق تعود لنفس الموضع بالضبط ويعود التركيز لما فتحه.
 */
export function PropertyLightbox({
  property,
  startIndex = 0,
  onClose,
  onIndexChange,
  showDetailsLink = false,
}: {
  property: Property;
  startIndex?: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  showDetailsLink?: boolean;
}) {
  const [index, setIndex] = useState(startIndex);
  const closeRef = useRef<HTMLButtonElement>(null);
  const total = property.gallery.length;
  const message = whatsappTemplates.property(property.title, property.id, `${window.location.origin}/property/${property.id}`);

  const go = (next: number) => {
    const value = (next + total) % total;
    setIndex(value);
    onIndexChange?.(value);
  };

  // إيقاف التمرير، والتركيز، والرجوع لنفس المكان عند الإغلاق
  useEffect(() => {
    const savedY = window.scrollY;
    const opener = document.activeElement as HTMLElement | null;
    pauseScroll();
    closeRef.current?.focus();
    return () => {
      // التركيز أولاً ثم الموضع: إرجاع التركيز لصورة الشريط قد يمرّر الصفحة إليها (للكيبورد)،
      // فيُطبَّق الموضع المحفوظ بعده ليبقى الزائر في نفس المكان بالضبط
      opener?.focus?.({ preventScroll: true });
      resumeScroll(savedY);
    };
  }, []);

  // Esc يغلق، والأسهم تقلّب
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") go(index + 1);
      if (event.key === "ArrowRight") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`صور ${property.title}`}>
      <div className="lightbox__top">
        <span className="lightbox__count">
          <Ltr>{index + 1}</Ltr> من <Ltr>{total}</Ltr>
        </span>
        <button ref={closeRef} className="lightbox__close icon-circle" onClick={onClose} aria-label="إغلاق">
          <X size={22} />
        </button>
      </div>
      <SwipeGallery
        className="lightbox__track"
        images={property.gallery}
        index={index}
        onIndex={(value) => {
          setIndex(value);
          onIndexChange?.(value);
        }}
        alt={property.title}
      />
      <button className="lightbox__nav lightbox__nav--prev" onClick={() => go(index + 1)} aria-label="الصورة التالية">
        <ChevronLeft size={24} />
      </button>
      <button className="lightbox__nav lightbox__nav--next" onClick={() => go(index - 1)} aria-label="الصورة السابقة">
        <ChevronRight size={24} />
      </button>
      <div className="lightbox__bottom">
        <WhatsAppButton label="اسأل عن هذا العقار" message={message} variant="light" />
        {showDetailsLink && (
          <Link href={`/property/${property.id}`} className="lightbox__details" onClick={onClose}>
            تفاصيل البيت
          </Link>
        )}
      </div>
    </div>
  );
}

export default PropertyLightbox;
