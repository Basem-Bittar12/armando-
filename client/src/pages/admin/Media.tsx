import { useMemo } from "react";
import { Link } from "wouter";
import { ImagePlus } from "lucide-react";
import { useDemoStore } from "@/store/DemoStore";
import AdminLayout from "./AdminLayout";
import ScopeNotice from "@/components/admin/ScopeNotice";

function MediaContent() {
  const { properties } = useDemoStore();

  /** كل صور العقارات الحالية، بدون تكرار */
  const images = useMemo(() => {
    const seen = new Map<string, { src: string; propertyId: string; title: string }>();
    properties.forEach((property) => {
      property.gallery.forEach((src) => {
        if (!seen.has(src)) seen.set(src, { src, propertyId: property.id, title: property.title });
      });
    });
    return Array.from(seen.values());
  }, [properties]);

  return (
    <div className="admin-content">
      <div className="properties-admin-heading">
        <div>
          <span className="eyebrow">MEDIA LIBRARY / {images.length}</span>
          <h2>مكتبة الصور</h2>
          <p>كل الصور المستخدمة حالياً في عقارات الموقع.</p>
        </div>
      </div>

      <ScopeNotice
        title="رفع الصور من الجهاز"
        body="رفع الصور وحذفها يحتاج خدمة تخزين (مثل S3 أو Cloudinary) وباك اند يحفظ الروابط. في هذه النسخة تُعرض الصور الحالية فقط، والإضافة تتم بصور جاهزة من نموذج «إضافة عقار»."
      />

      <section className="admin-panel">
        <div className="media-grid">
          {images.map((image) => (
            <Link key={image.src} href={`/property/${image.propertyId}`} className="media-tile">
              <img src={image.src} alt={image.title} loading="lazy" />
              <div className="media-tile__meta">
                <strong>{image.propertyId}</strong>
                <span>{image.title}</span>
              </div>
            </Link>
          ))}

          <div className="media-tile media-tile--placeholder">
            <ImagePlus size={22} />
            <strong>رفع صورة</strong>
            <span className="soon-tag">قريباً</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Media() {
  return (
    <AdminLayout title="مكتبة الصور">
      <MediaContent />
    </AdminLayout>
  );
}
