/**
 * دخول لوحة التحكم: إيميل وكلمة سر (Supabase Auth). التسجيل العام مقفل من إعدادات Supabase،
 * والمسؤول هو من له سطر بجدول admins (يُضاف من لوحة Supabase أو scripts/create-admin.ts).
 * بدون Supabase (وضع تجريبي) اللوحة مفتوحة لأن لا بيانات حقيقية.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { setAccessTokenProvider } from "@/lib/supabaseConfig";
import { useCatalog } from "@/lib/catalog/store";

type AuthState =
  | { status: "loading" }
  | { status: "demo" }
  | { status: "signed-out" }
  | { status: "not-admin"; email: string }
  | { status: "admin"; email: string };

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { reload } = useCatalog();
  const [state, setState] = useState<AuthState>(supabaseConfigured ? { status: "loading" } : { status: "demo" });

  const resolve = useCallback(
    async (session: Session | null) => {
      if (!session) {
        setState({ status: "signed-out" });
        return;
      }
      const email = session.user.email ?? "";
      const { data, error } = await getSupabase().rpc("is_admin");
      setState(!error && data === true ? { status: "admin", email } : { status: "not-admin", email });
    },
    [],
  );

  useEffect(() => {
    if (!supabaseConfigured) return;
    const auth = getSupabase().auth;
    // قراءات الكتالوج (REST) تستعمل جلسة المسؤول إن وُجدت
    setAccessTokenProvider(() => auth.getSession().then(({ data }) => data.session?.access_token ?? null));
    let alive = true;
    auth.getSession().then(({ data }) => {
      if (alive) void resolve(data.session);
    });
    const { data: listener } = auth.onAuthStateChange((event, session) => {
      if (!alive || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
      // بعد الدخول/الخروج نعيد تحميل البيانات: المسؤول يرى المسودات والخيارات الموقوفة
      void resolve(session).then(() => reload());
    });
    return () => {
      alive = false;
      setAccessTokenProvider(null);
      listener.subscription.unsubscribe();
    };
  }, [resolve, reload]);

  // أول فتح للوحة بجلسة محفوظة: البيانات حُمّلت كزائر قبل ما نعرف الجلسة، فنعيد تحميلها كمسؤول
  const isAdmin = state.status === "admin";
  useEffect(() => {
    if (isAdmin) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (!error) return null;
    if (/invalid login credentials/i.test(error.message)) return "الإيميل أو كلمة السر غير صحيحة";
    if (/email not confirmed/i.test(error.message)) return "الحساب غير مفعّل بعد";
    if (/fetch|network/i.test(error.message)) return "ما في اتصال بالإنترنت — جرّب مرة ثانية";
    return "ما قدرنا ندخلك — جرّب بعد شوي";
  }, []);

  const signOut = useCallback(async () => {
    if (supabaseConfigured) await getSupabase().auth.signOut();
  }, []);

  return <AuthContext.Provider value={{ ...state, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
