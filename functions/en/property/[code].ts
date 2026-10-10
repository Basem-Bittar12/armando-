/**
 * Pages Function: /en/property/:code (English) — صفحة الموقع نفسها + وسوم معاينة العقار
 * لروبوتات واتساب والسوشيال (shared/og.ts، نفس منطق Netlify Edge Function).
 * ملف _headers لا يُطبَّق على ردود الـFunctions، فنضيف noindex هنا حتى الإطلاق (INDEXING=true).
 */
import { withPropertyOg } from "../../../shared/og";
import type { PagesContext } from "../../../cloudflare/pages";

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  if (request.method !== "GET" && request.method !== "HEAD") return context.next();
  const page = await withPropertyOg(request, await context.next(), env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const headers = new Headers(page.headers);
  if (env.INDEXING !== "true") headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(request.method === "HEAD" ? null : page.body, { status: page.status, headers });
}
