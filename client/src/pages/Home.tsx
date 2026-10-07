import { useMemo } from "react";
import { Link } from "wouter";
import { brand, pageMeta } from "@/config/site";
import { useCatalog } from "@/lib/catalog/store";
import { areaCards } from "@/lib/catalog/view";
import { srcsetFor } from "@/lib/imageSrcset";
import { useMeta } from "@/hooks/useMeta";
import PublicLayout from "@/components/site/PublicLayout";
import HeroCanvas from "@/components/site/HeroCanvas";
import AvailableHomesStrip from "@/components/site/AvailableHomesStrip";
import WhatsAppButton from "@/components/site/WhatsAppButton";

/** عدد البيوت لكل منطقة محسوب من البيانات نفسها (نفس فلتر الرابط الذي تفتحه البطاقة) */
const countLabel = (count: number) => (count === 1 ? "بيت واحد" : count === 2 ? "بيتان" : `${count} بيوت`);

export default function Home() {
  useMeta(pageMeta.home);
  const { data } = useCatalog();
  // المناطق المفعّلة التي فيها عقار منشور، بأعدادها الحقيقية
  const areas = useMemo(() => (data ? areaCards(data) : []), [data]);

  return (
    <PublicLayout mobileBar="after-hero">
      {/* السكرول المربوط (scrub) هنا فقط: فريمات الفيديو + قصة الهيرو (HeroCanvas) */}
      <HeroCanvas />

      {/* «البيوت المتاحة»: شريط أفقي يتثبّت ويتحرك مع السكرول (القسم المثبّت الثاني بعد الهيرو) */}
      <AvailableHomesStrip />

      <section className="section section--dark statement-section">
        <div className="container statement-grid">
          <h2>
            نحن لا نعرض
            <br />
            منازل فقط
          </h2>
          <div className="statement-copy">
            <p>
              كل عقار في مجموعة {brand.shortAr} يمرّ بعناية من التفاصيل إلى
              الإطلالة. لأن المكان الذي تسكنه يترك أثراً في الطريقة التي تعيش
              بها.
            </p>
            <Link href="/contact" className="text-button text-button--light">
              تحدث مع مستشار
            </Link>
          </div>
        </div>
      </section>

      {areas.length > 0 && (
        <section className="section section--ruled">
          <div className="container">
            <div className="section-heading section-heading--center">
              <h2>اكتشف المكان</h2>
            </div>
            <div className="neighborhood-grid">
              {areas.map((area) => {
                const cover = area.cover ? srcsetFor(area.cover) : null;
                return (
                  <Link key={area.id} href={`/properties?q=${encodeURIComponent(area.name)}`} className="neighborhood-card">
                    {cover && (
                      <img src={cover.src} srcSet={cover.srcSet} sizes="(max-width: 760px) 100vw, 33vw" alt="" loading="lazy" decoding="async" />
                    )}
                    <div className="neighborhood-card__overlay" />
                    <div className="neighborhood-card__copy">
                      <span>{countLabel(area.count)}</span>
                      <h3>{area.name}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="section contact-banner">
        <div className="container contact-banner__inner">
          <h2>
            هل تبحث عن
            <br />
            عنوان جديد؟
          </h2>
          <div>
            <p>شاركنا تفضيلاتك، وسنساعدك في العثور على مساحة تشبهك.</p>
            <WhatsAppButton variant="light" />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
