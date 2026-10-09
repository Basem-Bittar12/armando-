/**
 * Netlify Edge Function: صفحة /property/:code (و/en/property/:code بالإنجليزي) تُرسل لروبوتات المعاينة (واتساب، فيسبوك، X…) بعنوان العقار
 * وسعره وصورة غلافه بدل عنوان الموقع العام. الموقع نفسه (React) لا يتغير.
 * يقرأ VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY من متغيرات Netlify (المفتاح العام فقط).
 */
import { buildOgTags, fetchOgProperty, injectOg } from "../../shared/og.ts";

declare const Netlify: { env: { get(name: string): string | undefined } };
type Context = { next(): Promise<Response> };

export default async function propertyOg(request: Request, context: Context): Promise<Response> {
  const response = await context.next();
  if (!response.headers.get("content-type")?.includes("text/html")) return response;
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  const lang = parts[0] === "en" ? "en" : "ar";
  const code = decodeURIComponent(parts[lang === "en" ? 2 : 1] ?? "");
  const url = Netlify.env.get("VITE_SUPABASE_URL");
  const key = Netlify.env.get("VITE_SUPABASE_ANON_KEY");
  if (!code || !url || !key) return response;
  try {
    const property = await fetchOgProperty(url, key, code, lang);
    if (!property) return response;
    const html = injectOg(await response.text(), buildOgTags(property, request.url), lang);
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(html, { status: response.status, headers });
  } catch (error) {
    console.error("[property-og]", error);
    return response;
  }
}
