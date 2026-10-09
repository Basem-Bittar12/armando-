import { useEffect } from "react";
import { indexing } from "@/config/site";
import { otherLangPath, useLang } from "@/i18n/lang";

/**
 * يضبط عنوان الصفحة ووسوم الميتا الأساسية عند فتح كل صفحة.
 * تحضير مبدئي للـ SEO — عند الانتقال لاحقاً إلى SSR (Next.js مثلاً) يمكن
 * استبدال هذا الهوك بوسوم الميتا المولّدة من السيرفر.
 */

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setLink(selector: string, attrs: Record<string, string>, href: string) {
  let link = document.head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement("link");
    for (const [key, value] of Object.entries(attrs)) link.setAttribute(key, value);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

const setCanonical = (href: string) => setLink('link[rel="canonical"]', { rel: "canonical" }, href);

/** روابط الصفحة نفسها باللغتين (hreflang) — لمحركات البحث بعد الإطلاق */
const setAlternate = (hreflang: string, href: string) =>
  setLink(`link[rel="alternate"][hreflang="${hreflang}"]`, { rel: "alternate", hreflang }, href);

export type MetaInput = {
  title: string;
  description: string;
  /** صورة المشاركة على السوشيال — اختيارية */
  image?: string;
  /** true لمنع أرشفة الصفحة (لوحة المكتب مثلاً) */
  noIndex?: boolean;
};

export function useMeta({ title, description, image, noIndex }: MetaInput) {
  const lang = useLang();
  useEffect(() => {
    document.title = title;

    setMetaTag("name", "description", description);
    setMetaTag("name", "robots", noIndex || !indexing ? "noindex, nofollow" : "index, follow");

    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:type", "website");
    setMetaTag("property", "og:url", window.location.href);
    setMetaTag("property", "og:locale", lang === "en" ? "en_AE" : "ar_AE");

    setMetaTag("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);

    if (image) {
      setMetaTag("property", "og:image", image);
      setMetaTag("name", "twitter:image", image);
    }

    const { origin, pathname } = window.location;
    setCanonical(origin + pathname);
    if (!noIndex) {
      const other = origin + otherLangPath(pathname, lang);
      setAlternate("ar", lang === "ar" ? origin + pathname : other);
      setAlternate("en", lang === "en" ? origin + pathname : other);
    }
  }, [title, description, image, noIndex, lang]);
}
