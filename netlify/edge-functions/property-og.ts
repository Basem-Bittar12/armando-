/**
 * Netlify Edge Function: صفحة /property/:code (و/en/property/:code بالإنجليزي) تُرسل لروبوتات المعاينة (واتساب، فيسبوك، X…)
 * بعنوان العقار وسعره وصورة غلافه بدل عنوان الموقع العام. الموقع نفسه (React) لا يتغير.
 * يقرأ VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY من متغيرات Netlify (المفتاح العام فقط).
 * نفس المنطق على Cloudflare Pages: functions/property/[code].ts (shared/og.ts).
 */
import { withPropertyOg } from "../../shared/og.ts";

declare const Netlify: { env: { get(name: string): string | undefined } };
type Context = { next(): Promise<Response> };

export default async function propertyOg(request: Request, context: Context): Promise<Response> {
  const page = await context.next();
  return withPropertyOg(request, page, Netlify.env.get("VITE_SUPABASE_URL"), Netlify.env.get("VITE_SUPABASE_ANON_KEY"));
}
