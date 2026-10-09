import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { ChevronRight, Heart, MapPin, Phone, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { brand, pageMetaFor, whatsappTemplatesFor } from "@/config/site";
import { propertyUrl, useLang, useT, type Lang } from "@/i18n/lang";
import { useSiteContact } from "@/hooks/useSiteContact";
import { useCatalog } from "@/lib/catalog/store";
import { publishedProperties } from "@/lib/catalog/view";
import { useFavorites } from "@/store/Favorites";
import { LoadError } from "@/components/site/CatalogState";
import { useMeta } from "@/hooks/useMeta";
import { lastListingHref, similarProperties } from "@/lib/propertyFilters";
import PublicLayout from "@/components/site/PublicLayout";
import PropertyCard, { rentalLabel, specsLine } from "@/components/site/PropertyCard";
import SwipeGallery from "@/components/site/SwipeGallery";
import PropertyLightbox from "@/components/site/PropertyLightbox";
import WhatsAppButton from "@/components/site/WhatsAppButton";
import { Ltr } from "@/components/site/pageContext";
import { srcsetFor } from "@/lib/imageSrcset";

const STATUS_EN: Record<string, string> = { متاح: "Available", محجوز: "Reserved", مؤجر: "Rented" };
const statusLabel = (status: string, lang: Lang) => (lang === "en" ? STATUS_EN[status] ?? status : status);

function NotFoundProperty({ id }: { id: string }) {
  const lang = useLang();
  const t = useT();
  useMeta(pageMetaFor(lang).notFound);
  return (
    <PublicLayout>
      <div className="container empty-state empty-state--page">
        <h3>
          {t("لم نعثر على العقار", "We couldn't find home")} <Ltr>{id}</Ltr>
        </h3>
        <p>{t("ربما تم تأجيره أو إزالته من المجموعة. تصفح بقية العقارات المتاحة.", "It may have been rented or removed from the collection. Browse the other available homes.")}</p>
        <div className="empty-state__actions">
          <Link href="/properties" className="primary-button">
            {t("عرض كل العقارات", "View all homes")}
          </Link>
          <WhatsAppButton label={t("اسأل عن عقار مشابه", "Ask about a similar home")} />
        </div>
      </div>
    </PublicLayout>
  );
}

/** عدّاد الصور «1 من 4» — الأرقام معزولة الاتجاه */
const counter = (index: number, total: number, lang: Lang) => (
  <>
    <Ltr>{index + 1}</Ltr> {lang === "en" ? "of" : "من"} <Ltr>{total}</Ltr>
  </>
);

export default function PropertyDetail() {
  const params = useParams<{ id: string }>();
  const { data, status, reload } = useCatalog();
  const { isFavorite, toggleFavorite } = useFavorites();
  const contact = useSiteContact();
  const lang = useLang();
  const t = useT();
  const meta = pageMetaFor(lang);
  const properties = useMemo(() => (data ? publishedProperties(data, lang) : []), [data, lang]);
  const property = properties.find((item) => item.id === params.id);

  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    setActiveImage(0);
  }, [params.id]);

  useMeta({
    title: property ? `${property.title} — ${property.id} | ${brand.name}` : meta.notFound.title,
    description: property
      ? lang === "en"
        ? `${property.type} for ${property.term.toLowerCase()} rent in ${property.location} · ${property.price} ${property.unit} · ${specsLine(property, lang)}`
        : `${property.type} ${property.term} في ${property.location} · ${property.price} ${property.unit} · ${property.beds === 0 ? "استوديو" : `${property.beds} غرف`} · ${property.area}`
      : meta.notFound.description,
    image: property?.image,
  });

  if (status === "loading") {
    return (
      <PublicLayout>
        <div className="container detail-loading" aria-busy="true">
          <div className="skeleton-block detail-loading__image" />
          <span className="skeleton-line skeleton-line--mid" />
          <span className="skeleton-line" />
          <span className="skeleton-line skeleton-line--short" />
        </div>
      </PublicLayout>
    );
  }
  if (status === "error") {
    return (
      <PublicLayout>
        <div className="container">
          <LoadError onRetry={reload} />
        </div>
      </PublicLayout>
    );
  }
  if (!property) return <NotFoundProperty id={params.id ?? ""} />;

  const favorite = isFavorite(property.id);
  // لبيت مؤجَّر: المشابهة من البيوت غير المؤجّرة فقط (الرابط يعدها «متاحة»)
  const similar = similarProperties(
    property.status === "مؤجر" ? properties.filter((item) => item.status !== "مؤجر") : properties,
    property,
  );
  // رابط الخريطة من لوحة التحكم إن وُجد، وإلا بحث باسم المنطقة
  const mapUrl = property.mapUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.location)}`;
  // البيت المؤجَّر: السؤال يصير عن بيت مشابه متاح
  const rented = property.status === "مؤجر";
  // رسالة واتساب: الكود والعنوان والرابط
  const templates = whatsappTemplatesFor(lang);
  const message = rented ? templates.similar(property.title, property.id) : templates.property(property.title, property.id, propertyUrl(lang, property.id));
  const askLabel = rented ? t("اسأل عن بيت مشابه", "Ask about a similar home") : t("استفسر عبر واتساب", "Ask on WhatsApp");
  const total = property.gallery.length;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, text: property.location, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success(t("تم نسخ رابط العقار", "Link copied"));
    } catch {
      // المستخدم ألغى المشاركة أو المتصفح لا يدعم النسخ
      toast.info(t("انسخ الرابط من شريط العنوان لمشاركته", "Copy the link from the address bar to share it"));
    }
  };

  const openAt = (index: number) => {
    setActiveImage(index);
    setLightbox(true);
  };

  return (
    <PublicLayout
      whatsappMessage={message}
      mobileBar={{
        showAfter: 400,
        content: (
          <>
            <div className="mobile-action-bar__price">
              <strong>{property.price}</strong>
              <span>{property.unit}</span>
            </div>
            <WhatsAppButton
              label={rented ? t("اسأل عن بيت مشابه", "Ask about a similar home") : t("اسأل عبر واتساب", "Ask on WhatsApp")}
              message={message}
              className="mobile-action-bar__ask"
            />
          </>
        ),
      }}
    >
      <div className="detail-page">
        <div className="container detail-breadcrumb">
          {/* يرجع لنفس البحث والفلاتر التي جاء منها الزائر */}
          <Link href={lastListingHref(lang)}>
            <ChevronRight size={18} /> {t("العودة إلى العقارات", "Back to properties")}
          </Link>
        </div>

        <div className="container detail-layout">
          <div className="detail-gallery">
            {/* موبايل: الصورة بعرض الشاشة وتُقلَّب بالسحب */}
            <div className="detail-swipe">
              <SwipeGallery
                images={property.gallery}
                index={activeImage}
                onIndex={setActiveImage}
                onSelect={openAt}
                alt={property.title}
              />
              <span className="detail-gallery__count">{counter(activeImage, total, lang)}</span>
            </div>

            {/* لابتوب: صورة كبيرة وصور مصغّرة */}
            <div className="detail-gallery__desktop">
              <button className="detail-gallery__main" onClick={() => setLightbox(true)} aria-label={t("تكبير الصورة", "Enlarge photo")}>
                {property.gallery.map((image, index) => (
                  <img
                    key={image + index}
                    {...srcsetFor(image)}
                    sizes="(max-width: 1100px) 66vw, 760px"
                    alt={index === activeImage ? property.title : ""}
                    aria-hidden={index !== activeImage}
                    className={index === activeImage ? "is-active" : ""}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding="async"
                  />
                ))}
                <span className="detail-gallery__count">{counter(activeImage, total, lang)}</span>
              </button>
              <div className="gallery-thumbs">
                {property.gallery.map((image, index) => (
                  <button
                    key={image + index}
                    className={index === activeImage ? "is-active" : ""}
                    onClick={() => setActiveImage(index)}
                    aria-label={t(`عرض الصورة ${index + 1}`, `Show photo ${index + 1}`)}
                  >
                    <img {...srcsetFor(image)} sizes="120px" alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* عمود المعلومات: ثابت (sticky) على اللابتوب */}
          <div className="detail-info">
            <span className="detail-info__term">{rentalLabel(property, lang)}</span>
            <div className="detail-info__title">
              <h1>{property.title}</h1>
              {/* الكود يظهر مرة واحدة فقط في الموقع: هنا جنب العنوان */}
              <span className="detail-info__code">
                <Ltr>{property.id}</Ltr>
              </span>
            </div>
            <p className="detail-info__location">
              <MapPin size={16} /> {property.location}
            </p>

            <div className="detail-price">
              <strong>{property.price}</strong>
              <span>{property.unit}</span>
              {/* الحالة تظهر فقط إذا لم يكن العقار متاحاً */}
              {property.status !== "متاح" && <small className="detail-status">{statusLabel(property.status, lang)}</small>}
            </div>
            {/* سعر ثانٍ (مثلاً سنوي بجانب الشهري) */}
            {property.prices.length > 1 && (
              <p className="detail-other-prices">
                {property.prices.slice(1).map((price) => (
                  <span key={price.term}>
                    {t("أو", "or")} <strong>{new Intl.NumberFormat("en-US").format(price.amount)}</strong> {price.unit}
                  </span>
                ))}
              </p>
            )}
            {rented && similar.length > 0 && (
              <a
                href="#similar"
                className="text-button"
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById("similar")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {t("هذا البيت مؤجر حالياً — شوف بيوت مشابهة متاحة", "This home is currently rented — see similar available homes")}
              </a>
            )}

            <p className="detail-specs">{specsLine(property, lang)}</p>

            <p className="detail-description">{property.description}</p>

            <div className="detail-actions">
              <WhatsAppButton label={askLabel} message={message} />
              <a href={`tel:${contact.phoneHref}`} className="outline-button">
                <Phone size={17} /> {t("اتصل بنا", "Call us")}
              </a>
              <button
                className={`icon-circle detail-fav ${favorite ? "is-active" : ""}`}
                onClick={() => {
                  const added = toggleFavorite(property.id);
                  toast.success(added ? t("تمت إضافة العقار للمفضلة", "Added to favorites") : t("تمت إزالة العقار من المفضلة", "Removed from favorites"));
                }}
                aria-label={favorite ? t("إزالة من المفضلة", "Remove from favorites") : t("إضافة للمفضلة", "Add to favorites")}
                aria-pressed={favorite}
              >
                <Heart size={18} fill={favorite ? "currentColor" : "none"} />
              </button>
              <button className="icon-circle" onClick={share} aria-label={t("مشاركة العقار", "Share this home")}>
                <Share2 size={18} />
              </button>
            </div>

            <div className="detail-note">
              <ShieldCheck size={17} />
              <span>{t("المعلومات المعروضة قابلة للتحديث حسب توفر العقار. تواصل معنا للتأكد من السعر والحالة.", "Details may change with availability. Contact us to confirm the price and status.")}</span>
            </div>
          </div>
        </div>

        {/* المرافق والتفاصيل والموقع: بلا إطارات، بفواصل Sandstone */}
        <div className="container detail-extra">
          {property.amenities.length > 0 && (
            <section className="detail-panel">
              <h2>{t("المرافق والمميزات", "Amenities and features")}</h2>
              <ul className="amenity-list">
                {property.amenities.map((amenity) => (
                  <li key={amenity}>{amenity}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="detail-panel">
            <h2>{t("تفاصيل العقار", "Property details")}</h2>
            <dl className="detail-table">
              <div>
                <dt>{t("كود العقار", "Property code")}</dt>
                <dd>
                  <Ltr>{property.id}</Ltr>
                </dd>
              </div>
              <div>
                <dt>{t("نوع العقار", "Property type")}</dt>
                <dd>{property.type}</dd>
              </div>
              <div>
                <dt>{t("نوع الإيجار", "Rental type")}</dt>
                <dd>{property.term}</dd>
              </div>
              <div>
                <dt>{t("المدينة", "City")}</dt>
                <dd>{property.city}</dd>
              </div>
              {/* «متاح من» يظهر فقط حين يضيف المكتب التاريخ للعقار */}
              {property.availableFrom && (
                <div>
                  <dt>{t("متاح من", "Available from")}</dt>
                  <dd>{property.availableFrom}</dd>
                </div>
              )}
              {property.details.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* إلى أن تتوفر خريطة حقيقية: اسم المنطقة ورابط الخريطة فقط */}
          <section className="detail-panel detail-panel--map">
            <h2>{t("الموقع", "Location")}</h2>
            <p className="detail-location">
              <MapPin size={16} /> {property.location}
            </p>
            <a href={mapUrl} target="_blank" rel="noreferrer" className="text-button">
              {t("افتح بالخريطة", "Open in maps")}
            </a>
          </section>
        </div>

        {similar.length > 0 && (
          <section className="section section--ruled" id="similar">
            <div className="container">
              <div className="section-heading">
                <h2>{t("عقارات مشابهة", "Similar homes")}</h2>
                <Link href="/properties" className="text-button">
                  {t("كل العقارات", "All properties")}
                </Link>
              </div>
              <div className="property-grid">
                {similar.map((item) => (
                  <PropertyCard key={item.id} property={item} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* المعرض المكبّر المشترك (PropertyLightbox) */}
      {lightbox && (
        <PropertyLightbox
          property={property}
          startIndex={activeImage}
          onIndexChange={setActiveImage}
          onClose={() => setLightbox(false)}
        />
      )}
    </PublicLayout>
  );
}
