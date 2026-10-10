/**
 * أنواع Cloudflare Pages Functions المستعملة في functions/ (بدل حزمة @cloudflare/workers-types كاملة).
 */
export interface PagesEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  /** "true" عند الإطلاق: يسمح لمحركات البحث (وإلا noindex على صفحات الـFunctions) */
  INDEXING?: string;
}

export interface PagesContext {
  request: Request;
  env: PagesEnv;
  params: Record<string, string | string[]>;
  next(input?: Request | string): Promise<Response>;
  waitUntil(promise: Promise<unknown>): void;
}

declare global {
  interface CacheStorage {
    /** كاش مركز البيانات الحالي في Cloudflare */
    readonly default: Cache;
  }
}
