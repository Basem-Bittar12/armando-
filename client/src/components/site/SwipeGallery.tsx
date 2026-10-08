import { useEffect, useRef } from "react";
import { srcsetFor } from "@/lib/imageSrcset";

/** تمرير الشريط إلى صورة — scrollTo إن وُجد (مع حركة اختيارية)، وإلا scrollLeft مباشرة */
function scrollToSlide(track: HTMLElement, child: HTMLElement, smooth: boolean) {
  const left = child.offsetLeft - track.offsetLeft - (track.clientWidth - child.clientWidth) / 2;
  if (typeof track.scrollTo === "function") track.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  else track.scrollLeft = left;
}

/**
 * شريط صور يُقلَّب بالسحب (scroll-snap أصلي من المتصفح، يعمل مع اللمس والماوس واللوحة).
 * index/onIndex: الصورة الحالية — تتحدث عند السحب، وأي تغيير من الخارج (أسهم، كيبورد) يمرّر الشريط إليها.
 */
export function SwipeGallery({
  images,
  index,
  onIndex,
  onSelect,
  alt,
  className = "",
}: {
  images: string[];
  index: number;
  onIndex: (index: number) => void;
  onSelect?: (index: number) => void;
  alt: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const current = useRef(index);

  // الصورة الأقرب لمنتصف الشريط هي الحالية (يعمل مع اتجاه RTL بلا حسابات scrollLeft)
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.getBoundingClientRect().left + track.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const rect = child.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      if (distance < best) {
        best = distance;
        nearest = i;
      }
    });
    if (nearest !== current.current) {
      current.current = nearest;
      onIndex(nearest);
    }
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track || index === current.current) return;
    current.current = index;
    const child = track.children[index] as HTMLElement | undefined;
    if (child) scrollToSlide(track, child, true);
  }, [index]);

  // الفتح على صورة محددة: نمرّر بلا حركة عند التركيب
  useEffect(() => {
    const track = trackRef.current;
    const child = track?.children[index] as HTMLElement | undefined;
    if (track && child) scrollToSlide(track, child, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- مرة واحدة عند التركيب
  }, []);

  return (
    <div ref={trackRef} className={`swipe-gallery ${className}`} onScroll={onScroll}>
      {images.map((image, i) => (
        <div className="swipe-gallery__slide" key={image + i}>
          {onSelect ? (
            <button type="button" onClick={() => onSelect(i)} aria-label={`تكبير الصورة ${i + 1}`}>
              <img
                {...srcsetFor(image)}
                sizes="100vw"
                alt={i === index ? alt : ""}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                draggable={false}
              />
            </button>
          ) : (
            <img {...srcsetFor(image)} sizes="100vw" alt={i === index ? alt : ""} loading="lazy" decoding="async" draggable={false} />
          )}
        </div>
      ))}
    </div>
  );
}

export default SwipeGallery;
