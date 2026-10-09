import { Link } from "wouter";
import { pageMetaFor } from "@/config/site";
import { useLang, useT } from "@/i18n/lang";
import { useMeta } from "@/hooks/useMeta";
import PublicLayout from "@/components/site/PublicLayout";
import WhatsAppButton from "@/components/site/WhatsAppButton";

export default function NotFound() {
  const lang = useLang();
  const t = useT();
  useMeta({ ...pageMetaFor(lang).notFound, noIndex: true });

  return (
    <PublicLayout>
      <div className="container notfound-page">
        <h1>
          {t("الصفحة التي تبحث عنها", "The page you are looking for")}
          <br />
          {t("غير موجودة", "does not exist")}
        </h1>
        <p>{t("ربما تغيّر الرابط أو تمت إزالة الصفحة. يمكنك العودة إلى المجموعة من هنا.", "The link may have changed or the page was removed. You can return to the collection from here.")}</p>
        <div className="empty-state__actions">
          <Link href="/" className="primary-button primary-button--large">
            {t("العودة إلى الرئيسية", "Back to home")}
          </Link>
          <Link href="/properties" className="outline-button">
            {t("تصفح العقارات", "Browse properties")}
          </Link>
          <WhatsAppButton label={t("تحدث مع مستشار", "Talk to an advisor")} />
        </div>
      </div>
    </PublicLayout>
  );
}
