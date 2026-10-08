import { useEffect } from "react";
import { indexing } from "@/config/site";

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

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

export type MetaInput = {
  title: string;
  description: string;
  /** صورة المشاركة على السوشيال — اختيارية */
  image?: string;
  /** true لمنع أرشفة الصفحة (لوحة المكتب مثلاً) */
  noIndex?: boolean;
};

export function useMeta({ title, description, image, noIndex }: MetaInput) {
  useEffect(() => {
    document.title = title;

    setMetaTag("name", "description", description);
    setMetaTag("name", "robots", noIndex || !indexing ? "noindex, nofollow" : "index, follow");

    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:type", "website");
    setMetaTag("property", "og:url", window.location.href);
    setMetaTag("property", "og:locale", "ar_AE");

    setMetaTag("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);

    if (image) {
      setMetaTag("property", "og:image", image);
      setMetaTag("name", "twitter:image", image);
    }

    setCanonical(window.location.origin + window.location.pathname);
  }, [title, description, image, noIndex]);
}
