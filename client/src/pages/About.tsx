import { pageMetaFor } from "@/config/site";
import { useLang, useT } from "@/i18n/lang";
import { useMeta } from "@/hooks/useMeta";
import PublicLayout from "@/components/site/PublicLayout";

/**
 * «رؤيتنا ورسالتنا» — النصوص حرفياً من ملف المكتب Vision_Mission_Values.pdf (10/2026)، لا تُعدَّل من عندنا.
 */
const statements = [
  {
    ar: { label: "رؤيتنا", text: "أن نكون الخيار الأول في دبي لإدارة بيوت العطلات والأبراج المفروشة." },
    en: { label: "Our vision", text: "To be Dubai's first choice for furnished holiday homes and tower management." },
  },
  {
    ar: { label: "رسالتنا", text: "إقامة راقية ومرنة لضيوفنا، وإدارة احترافية وشفافة لعقارات ملاكنا." },
    en: { label: "Our mission", text: "Refined, flexible stays for our guests, and professional, transparent management for our owners." },
  },
] as const;

const values = [
  { ar: "الضيافة أولاً", en: "Hospitality First" },
  { ar: "المرونة", en: "Flexibility" },
  { ar: "الرقي الهادئ", en: "Quiet Refinement" },
  { ar: "الثقة والشفافية", en: "Trust & Transparency" },
  { ar: "الإتقان", en: "Mastery" },
  { ar: "النمو المسؤول", en: "Responsible Growth" },
];
const roman = ["I", "II", "III", "IV", "V", "VI"];

export default function About() {
  const lang = useLang();
  const t = useT();
  useMeta(pageMetaFor(lang).about);

  return (
    <PublicLayout>
      <div className="about-page">
        <div className="container about-inner">
          <p className="about-eyebrow">{t("أرماندو القاضي لبيوت العطلات", "Armando Alkadi Holiday Homes")}</p>
          <h1>{t("رؤيتنا ورسالتنا", "Vision & Mission")}</h1>

          <div className="about-statements">
            {statements.map((s) => (
              <section key={s.en.label} className="about-statement">
                <h2>{s[lang].label}</h2>
                <p>{s[lang].text}</p>
              </section>
            ))}
          </div>

          <section className="about-values" aria-labelledby="about-values-title">
            <h2 id="about-values-title">{t("قيمنا", "Our values")}</h2>
            <ol>
              {values.map((v, i) => (
                <li key={v.en}>
                  <span className="about-values__num" lang="en">{roman[i]}</span>
                  <strong>{t(v.ar, v.en)}</strong>
                  <span className="about-values__sub" lang={lang === "en" ? "ar" : "en"}>{lang === "en" ? v.ar : v.en}</span>
                </li>
              ))}
            </ol>
          </section>

          <p className="about-tagline" lang="en">STAY YOUR WAY</p>
        </div>
      </div>
    </PublicLayout>
  );
}
