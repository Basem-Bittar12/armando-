import { Link } from "wouter";
import { pageMeta } from "@/config/site";
import { useMeta } from "@/hooks/useMeta";
import PublicLayout from "@/components/site/PublicLayout";
import WhatsAppButton from "@/components/site/WhatsAppButton";

export default function NotFound() {
  useMeta({ ...pageMeta.notFound, noIndex: true });

  return (
    <PublicLayout>
      <div className="container notfound-page">
        <h1>
          الصفحة التي تبحث عنها
          <br />
          غير موجودة
        </h1>
        <p>ربما تغيّر الرابط أو تمت إزالة الصفحة. يمكنك العودة إلى المجموعة من هنا.</p>
        <div className="empty-state__actions">
          <Link href="/" className="primary-button primary-button--large">
            العودة إلى الرئيسية
          </Link>
          <Link href="/properties" className="outline-button">
            تصفح العقارات
          </Link>
          <WhatsAppButton label="تحدث مع مستشار" />
        </div>
      </div>
    </PublicLayout>
  );
}
