import { Link } from "wouter";
import { brand } from "@/config/site";
import { useT } from "@/i18n/lang";

/**
 * شعار المكتب — ملفات SVG الرسمية فقط من ملف الهوية، بلا إعادة رسم ولا تلوين ولا فلاتر.
 * - monogram: المونوغرام AK بلون Espresso على أرضية فاتحة (الهيدر، قائمة الموبايل)
 * - monogram-inverse: نفس المونوغرام بلون Almond على أرضية داكنة (لوحة المكتب)
 * - bilingual-inverse: الشعار ثنائي اللغة (العربي أولاً) على Espresso (الفوتر)
 * الأحجام والمسافة الفارغة حولها في index.css (.brand-logo--*) حسب README الهوية.
 */
type Variant = "monogram" | "monogram-inverse" | "bilingual-inverse";

const SOURCES: Record<Variant, string> = {
  monogram: brand.logo.monogram,
  "monogram-inverse": brand.logo.monogramInverse,
  "bilingual-inverse": brand.logo.bilingualInverse,
};

export function Logo({ variant = "monogram", asLink = true }: { variant?: Variant; asLink?: boolean }) {
  const t = useT();
  const image = (
    <img
      src={SOURCES[variant]}
      alt={t(`${brand.nameAr} — ${brand.name}`, `${brand.name} — ${brand.nameAr}`)}
      className={`brand-logo brand-logo--${variant}`}
      decoding="async"
    />
  );

  if (!asLink) return image;

  return (
    <Link href="/" className="brand-link" aria-label={t(`${brand.nameAr} — الصفحة الرئيسية`, `${brand.name} — Home`)}>
      {image}
    </Link>
  );
}

export default Logo;
