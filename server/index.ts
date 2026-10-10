import compression from "compression";
import { config } from "dotenv";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { IMG_CACHE_CONTROL, directImageUrl, storagePathFromImg } from "../shared/img";

// محلياً (اختبارات e2e وقياس الأداء): عنوان Supabase من .env.local لمسار الصور /img
config({ path: ".env.local", quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  // ضغط gzip مثل Netlify (لقياس الأداء محلياً بشكل واقعي)
  app.use(compression());
  // ملفات assets بأسماء فيها hash: تخزين طويل بالمتصفح
  app.use("/assets", express.static(path.join(staticPath, "assets"), { immutable: true, maxAge: "1y" }));
  app.use(express.static(staticPath));

  // صور /img: نفس عمل Cloudflare Pages Function (functions/img) — من Supabase Storage بتخزين سنة
  app.get("/img/*", async (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const storagePath = storagePathFromImg(req.path);
    if (!storagePath || !supabaseUrl) return res.status(404).set("Cache-Control", "no-store").end();
    try {
      const upstream = await fetch(directImageUrl(supabaseUrl, storagePath));
      const type = upstream.headers.get("content-type") ?? "";
      if (!upstream.ok || !type.startsWith("image/")) return res.status(upstream.status === 404 || upstream.status === 400 ? 404 : 502).set("Cache-Control", "no-store").end();
      res.set({ "Content-Type": type, "Cache-Control": IMG_CACHE_CONTROL });
      res.send(Buffer.from(await upstream.arrayBuffer()));
    } catch {
      res.status(502).set("Cache-Control", "no-store").end();
    }
  });

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
