/**
 * لغة الموقع العام: العربي على الروابط العادية (/، /properties…) والإنجليزي تحت /en (/en، /en/properties…).
 * اللغة تُعرف من الرابط فقط، فكل صفحة لها رابط ثابت بكل لغة (مشاركة، Google، زر اللغة).
 * النصوص الثابتة تُكتب بالمكوّن نفسه كزوج: t("العقارات", "Properties").
 * لوحة التحكم عربية فقط وليست تحت /en.
 */
import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";

export type Lang = "ar" | "en";

const LangContext = createContext<Lang>("ar");

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  // اتجاه ولغة الصفحة كلها (الخط، المحاذاة، قارئات الشاشة)
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
    return () => {
      document.documentElement.lang = "ar";
      document.documentElement.dir = "rtl";
    };
  }, [lang]);
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** نص بلغتين: t(عربي، إنجليزي) */
export function useT() {
  const lang = useLang();
  return useCallback((ar: string, en: string) => (lang === "en" ? en : ar), [lang]);
}

/** قيمة من قاعدة البيانات: الإنجليزي إن وُجد، وإلا العربي */
export const pickLang = (lang: Lang, ar: string, en: string | null | undefined) => (lang === "en" && en?.trim() ? en.trim() : ar);

/** بادئة الرابط حسب اللغة: "/en" أو "" */
export const langPrefix = (lang: Lang) => (lang === "en" ? "/en" : "");

/** الرابط نفسه باللغة الأخرى (المسار فقط: قيم الفلاتر تختلف بين اللغتين فلا تُنقل) */
export function otherLangPath(pathname: string, lang: Lang) {
  if (lang === "en") {
    const rest = pathname.replace(/^\/en(?=\/|$)/, "");
    return rest || "/";
  }
  return pathname === "/" ? "/en" : `/en${pathname}`;
}

/** الرابط الكامل لصفحة عقار بلغة معيّنة (لرسائل واتساب والمشاركة) */
export const propertyUrl = (lang: Lang, code: string) => `${window.location.origin}${langPrefix(lang)}/property/${encodeURIComponent(code)}`;
