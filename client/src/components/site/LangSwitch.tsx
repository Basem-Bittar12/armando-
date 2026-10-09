import { Link, useLocation } from "wouter";
import { langPrefix, otherLangPath, useLang } from "@/i18n/lang";

/**
 * زر اللغة — واحد بكل صفحات الموقع: بالعربي يظهر «EN» وبالإنجليزي «عربي».
 * يفتح نفس الصفحة باللغة الثانية (الرابط فقط؛ الفلاتر تُصفَّر لأن قيمها تختلف بين اللغتين).
 */
export function LangSwitch({ className = "" }: { className?: string }) {
  const lang = useLang();
  const [location] = useLocation();
  const target = otherLangPath(`${langPrefix(lang)}${location === "/" && lang === "en" ? "" : location}` || "/", lang);
  const toEnglish = lang === "ar";
  return (
    <Link
      href={`~${target}`}
      className={`header-lang ${className}`.trim()}
      lang={toEnglish ? "en" : "ar"}
      hrefLang={toEnglish ? "en" : "ar"}
      aria-label={toEnglish ? "English" : "العربية"}
    >
      {toEnglish ? "EN" : "عربي"}
    </Link>
  );
}

export default LangSwitch;
