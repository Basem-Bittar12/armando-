import { Link } from "wouter";
import { brand } from "@/config/site";

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
  const image = (
    <img
      src={SOURCES[variant]}
      alt={`${brand.nameAr} — ${brand.name}`}
      className={`brand-logo brand-logo--${variant}`}
      decoding="async"
    />
  );

  if (!asLink) return image;

  return (
    <Link href="/" className="brand-link" aria-label={`${brand.nameAr} — الصفحة الرئيسية`}>
      {image}
    </Link>
  );
}

export default Logo;
