import { Heart, MapPin } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import type { Property } from "@/data/properties";
import { useDemoStore } from "@/store/DemoStore";

/** نوع العقار ومدة الإيجار ككلام عادي: "شقة للإيجار الشهري" */
export const rentalLabel = (property: Pick<Property, "type" | "term">) =>
  `${property.type} للإيجار ال${property.term}`;

/** المواصفات في سطر واحد */
export const specsLine = (property: Pick<Property, "beds" | "baths" | "area">) =>
  [property.beds === 0 ? "استوديو" : `${property.beds} غرف`, `${property.baths} حمام`, property.area].join(" · ");

/**
 * بطاقة العقار — بلا خلفية ولا إطار ولا خطوط، الكارت كله رابط واحد.
 * الترتيب: الصورة، نوع الإيجار، العنوان، المنطقة، المواصفات، السعر — 12px بينها.
 * الشارة الوحيدة «جديد»؛ البيت المؤجَّر يظهر بشفافية 60% (وصفحة العقارات تنقله لآخر القائمة).
 */
export function PropertyCard({ property }: { property: Property }) {
  const { isFavorite, toggleFavorite } = useDemoStore();
  const favorite = isFavorite(property.id);
  const rented = property.status === "مؤجر";

  const onToggleFavorite = () => {
    const added = toggleFavorite(property.id);
    toast.success(added ? "تمت إضافة العقار للمفضلة" : "تمت إزالة العقار من المفضلة");
  };

  return (
    <article className={`property-card ${rented ? "property-card--rented" : ""}`}>
      <div className="property-card__image-wrap">
        <img src={property.image} alt="" className="property-card__image" loading="lazy" decoding="async" />
        {property.new && (
          <div className="property-card__chips">
            <span className="chip chip--dark">جديد</span>
          </div>
        )}
        <button
          className={`icon-circle property-card__heart ${favorite ? "is-active" : ""}`}
          aria-label={favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          aria-pressed={favorite}
          onClick={onToggleFavorite}
        >
          <Heart size={18} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="property-card__body">
        <span className="property-card__term">{rentalLabel(property)}</span>
        <h3>
          <Link href={`/property/${property.id}`} className="property-card__link">
            {property.title}
          </Link>
        </h3>
        <p className="property-card__location">
          <MapPin size={15} /> {property.location}
        </p>
        <p className="property-card__specs">{specsLine(property)}</p>
        <p className="property-card__price">
          <strong>{property.price}</strong> <span>درهم / {property.term}</span>
        </p>
      </div>
    </article>
  );
}

export default PropertyCard;
