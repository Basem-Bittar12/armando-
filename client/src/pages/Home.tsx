import { useMemo } from "react";
import { Link } from "wouter";
import { brand, pageMeta } from "@/config/site";
import { neighborhoods } from "@/data/properties";
import { useDemoStore } from "@/store/DemoStore";
import { useMeta } from "@/hooks/useMeta";
import { applyFilters, filtersFromParams } from "@/lib/propertyFilters";
import PublicLayout from "@/components/site/PublicLayout";
import HeroCanvas from "@/components/site/HeroCanvas";
import AvailableHomesStrip from "@/components/site/AvailableHomesStrip";
import WhatsAppButton from "@/components/site/WhatsAppButton";

/** عدد البيوت لكل منطقة محسوب من البيانات نفسها (نفس فلتر الرابط الذي تفتحه البطاقة) */
const countLabel = (count: number) => (count === 1 ? "بيت واحد" : count === 2 ? "بيتان" : `${count} بيوت`);

export default function Home() {
  useMeta(pageMeta.home);
  const { properties } = useDemoStore();

  const areaCounts = useMemo(
    () =>
      neighborhoods.map(
        neighborhood => applyFilters(properties, filtersFromParams(new URLSearchParams(neighborhood.query)), []).length,
      ),
    [properties],
  );

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

      <section className="section section--ruled">
        <div className="container">
          <div className="section-heading section-heading--center">
            <h2>اكتشف المكان</h2>
          </div>
          <div className="neighborhood-grid">
            {neighborhoods.map((neighborhood, index) => (
              <Link
                key={neighborhood.name}
                href={`/properties${neighborhood.query}`}
                className="neighborhood-card"
              >
                <img src={neighborhood.image} alt="" loading="lazy" decoding="async" />
                <div className="neighborhood-card__overlay" />
                <div className="neighborhood-card__copy">
                  {areaCounts[index] > 0 && <span>{countLabel(areaCounts[index])}</span>}
                  <h3>{neighborhood.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
