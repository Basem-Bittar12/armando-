import { Link } from "wouter";
import { CircleHelp, Download, LogOut, Phone, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCatalog } from "@/lib/catalog/store";
import AdminShell from "./AdminShell";
import { downloadBackup } from "./backup";

/** «المزيد» على التلفون: باقي أقسام اللوحة بأزرار كبيرة */
export default function More() {
  return (
    <AdminShell title="المزيد">
      <MoreBody />
    </AdminShell>
  );
}

function MoreBody() {
  const auth = useAuth();
  const catalog = useCatalog();
  return (
    <ul className="adm-menu">
      <li>
        <Link href="/admin/options">
          <SlidersHorizontal size={20} /> الخيارات
          <small>مدن، مناطق، أنواع، مرافق</small>
        </Link>
      </li>
      <li>
        <Link href="/admin/contact">
          <Phone size={20} /> معلومات التواصل
          <small>هاتف، واتساب، عنوان</small>
        </Link>
      </li>
      <li>
        <button type="button" onClick={() => downloadBackup(catalog.data!)}>
          <Download size={20} /> نسخة احتياطية
          <small>ملف JSON</small>
        </button>
      </li>
      <li>
        <Link href="/admin/help">
          <CircleHelp size={20} /> المساعدة
        </Link>
      </li>
      {auth.status === "admin" && (
        <li>
          <button type="button" onClick={() => auth.signOut()}>
            <LogOut size={20} /> خروج
            <small>
              <bdi dir="ltr">{auth.email}</bdi>
            </small>
          </button>
        </li>
      )}
    </ul>
  );
}
