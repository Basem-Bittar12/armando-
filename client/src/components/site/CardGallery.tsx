import { useRef, useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { srcsetFor } from "@/lib/imageSrcset";

/** أقصى عدد نقاط؛ بعد الصورة الرابعة تبقى آخر نقطة هي المعلَّمة */
const MAX_DOTS = 4;

/**
 * صور الكرت قابلة للتقليب من برا، قبل فتح البيت: سحب بالإصبع (scroll-snap) على التلفون، وأسهم عند المرور
 * بالماوس على اللابتوب، ونقاط تحت الصورة تبين أن هناك صوراً أخرى. الضغط على الصورة يفتح صفحة البيت.
 */
/** priority: أول كروت الصفحة (أكبر عنصر بالشاشة) — صورتها الأولى تُحمَّل فوراً وبأولوية */
export function CardGallery({ images, href, alt, priority = false }: { images: string[]; href: string; alt: string; priority?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = images.length;
  const dots = Math.min(count, MAX_DOTS);
  const activeDot = Math.min(index, MAX_DOTS - 1);

  // الموضع الحالي من السكرول (في RTL يكون scrollLeft سالباً، فنأخذ القيمة المطلقة)
  const onScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const next = Math.round(Math.abs(track.scrollLeft) / track.clientWidth);
    if (next !== index) setIndex(Math.min(count - 1, Math.max(0, next)));
  };

  const goTo = (target: number) => {
    const slide = trackRef.current?.children[Math.min(count - 1, Math.max(0, target))] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  return (
    <div className="card-gallery">
      {/* قابل للتركيز ليتصفح مستخدم لوحة المفاتيح الصور بالأسهم */}
      <div className="card-gallery__track" ref={trackRef} onScroll={onScroll} tabIndex={0} role="group" aria-label={`صور ${alt}`}>
        {images.map((image, i) => {
          const set = srcsetFor(image);
          return (
            // كل صورة رابط لصفحة البيت (خارج ترتيب التبويب: رابط العنوان هو الرابط الأساسي)
            <Link key={image + i} href={href} className="card-gallery__slide" tabIndex={-1} aria-hidden="true" draggable={false}>
              <img
                src={set.src}
                srcSet={set.srcSet}
                sizes="(max-width: 760px) 50vw, 320px"
                alt={i === 0 ? alt : ""}
                className="property-card__image"
                loading={priority && i === 0 ? "eager" : "lazy"}
                fetchPriority={priority && i === 0 ? "high" : "auto"}
                decoding="async"
                draggable={false}
              />
            </Link>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <div className="card-gallery__dots" aria-hidden="true">
            {Array.from({ length: dots }, (_, i) => (
              <span key={i} className={i === activeDot ? "is-active" : ""} />
            ))}
          </div>
          {/* أسهم للماوس فقط (تظهر عند المرور على الصورة) */}
          <button
            type="button"
            className="card-gallery__arrow card-gallery__arrow--prev"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="الصورة السابقة"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            className="card-gallery__arrow card-gallery__arrow--next"
            onClick={() => goTo(index + 1)}
            disabled={index === count - 1}
            aria-label="الصورة التالية"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="sr-only">
            الصورة {index + 1} من {count}
          </span>
        </>
      )}
    </div>
  );
}

export default CardGallery;
