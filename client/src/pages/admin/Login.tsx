import { useState } from "react";
import { pageMeta } from "@/config/site";
import { useMeta } from "@/hooks/useMeta";
import { useAuth } from "@/lib/auth";
import { Field, TextInput } from "@/components/admin/Fields";

/** دخول اللوحة: إيميل وكلمة سر. ما في تسجيل حساب جديد من هون — المسؤولون يُضافون من Supabase. */
export default function Login() {
  useMeta({ ...pageMeta.admin, noIndex: true });
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("اكتب الإيميل وكلمة السر");
      return;
    }
    setBusy(true);
    setError(await auth.signIn(email, password));
    setBusy(false);
  };

  return (
    <main className="adm-login">
      <div className="adm-login__card">
        <div className="adm-login__brand">
          <img src="/brand/aahh/AAHH_Monogram_transparent.svg" alt="" width={56} height={56} />
          <h1>لوحة المكتب</h1>
          <p>أرماندو القاضي لبيوت العطلات</p>
        </div>

        {auth.status === "not-admin" ? (
          <>
            <p className="adm-login__error" role="alert">
              الحساب <bdi dir="ltr">{auth.email}</bdi> ما عنده صلاحية على اللوحة. اطلب من مسؤول يضيفه، أو ادخل بحساب ثاني.
            </p>
            <button type="button" className="adm-button" onClick={() => auth.signOut()}>
              خروج
            </button>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <Field label="الإيميل">
              <TextInput type="email" dir="ltr" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="كلمة السر">
              <TextInput type="password" dir="ltr" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error && (
              <p className="adm-login__error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="adm-button adm-button--primary" disabled={busy}>
              {busy ? "جاري الدخول…" : "دخول"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
