/**
 * Pages Function: /img/<bucket>/<path> — صور العقارات من Supabase Storage عبر كاش Cloudflare.
 *
 * أول طلب في مركز بيانات Cloudflare: نجلب الصورة من Supabase ونحفظها في الكاش سنة (Cache API).
 * كل طلب بعده من نفس المركز: من الكاش مباشرة، بلا أي نقل من Supabase (خطة Supabase المجانية: 5 GB نقل بالشهر).
 * X-Img-Cache: HIT | MISS يبين المصدر. الأخطاء (404…) لا تُحفظ أبداً، فصورة رُفعت للتو تظهر فوراً.
 * المتغيرات: VITE_SUPABASE_URL (نفس متغير البناء في إعدادات مشروع Pages).
 */
import { IMG_CACHE_CONTROL, directImageUrl, storagePathFromImg } from "../../shared/img";
import type { PagesContext } from "../../cloudflare/pages";

const COPY = ["content-type", "content-length", "etag", "last-modified"];

function finish(response: Response, status: "HIT" | "MISS", method: string) {
  const headers = new Headers(response.headers);
  headers.set("X-Img-Cache", status);
  return new Response(method === "HEAD" ? null : response.body, { status: response.status, headers });
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const url = new URL(request.url);
  const storagePath = storagePathFromImg(url.pathname);
  const supabaseUrl = env.VITE_SUPABASE_URL;
  if (!storagePath || !supabaseUrl) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  // مفتاح الكاش: المسار فقط (بلا query) — نفس الصورة دائماً نفس المفتاح
  const cache = caches.default;
  const key = new Request(`${url.origin}${url.pathname}`, { method: "GET" });
  const cached = await cache.match(key);
  if (cached) return finish(cached, "HIT", request.method);

  const upstream = await fetch(directImageUrl(supabaseUrl, storagePath));
  const type = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !type.startsWith("image/")) {
    await upstream.body?.cancel();
    const status = upstream.status === 404 || upstream.status === 400 ? 404 : 502;
    return new Response(status === 404 ? "Not found" : "Upstream error", { status, headers: { "Cache-Control": "no-store" } });
  }

  const headers = new Headers({ "Cache-Control": IMG_CACHE_CONTROL });
  for (const name of COPY) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  const response = new Response(upstream.body, { status: 200, headers });
  context.waitUntil(cache.put(key, response.clone()));
  return finish(response, "MISS", request.method);
}
