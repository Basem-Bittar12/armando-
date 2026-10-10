import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const plugins = [react(), tailwindcss()];

export default defineConfig(({ mode }) => ({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  // اختبارات الوحدة تعمل دائماً على البيانات التجريبية بالذاكرة (حتى لو .env.local فيه Supabase)
  test: {
    env: { VITE_SUPABASE_URL: "", VITE_SUPABASE_ANON_KEY: "" },
    include: ["src/**/*.test.{ts,tsx}"],
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // صور /img (مثل Cloudflare Pages Function) أثناء التطوير: من Supabase Storage مباشرة
    proxy: {
      "/img": {
        target: loadEnv(mode, import.meta.dirname, "VITE_").VITE_SUPABASE_URL || "http://127.0.0.1:54321",
        changeOrigin: true,
        rewrite: (url: string) => url.replace(/^\/img\//, "/storage/v1/object/public/"),
      },
    },
  },
}));
