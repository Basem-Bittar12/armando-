import { contact as fallback, social as fallbackSocial, whatsappTemplatesFor } from "@/config/site";
import { pickLang, useLang } from "@/i18n/lang";
import { useCatalog } from "@/lib/catalog/store";

/**
 * معلومات التواصل كما يحفظها صاحب الموقع من اللوحة (جدول settings).
 * قبل وصول البيانات (أو بدون Supabase) نستعمل القيم الافتراضية من config/site.ts.
 */
export function useSiteContact() {
  const { data } = useCatalog();
  const lang = useLang();
  const s = data?.settings;
  const phone = s?.phone ?? fallback.phoneDisplay;
  const whatsapp = s?.whatsapp || fallback.whatsapp;
  return {
    phone,
    /** للرابط tel: — أرقام فقط مع + بالبداية */
    phoneHref: phone ? `${phone.trim().startsWith("+") ? "+" : ""}${phone.replace(/\D/g, "")}` : "",
    whatsapp,
    email: s ? s.email : fallback.email,
    // العنوان وساعات العمل بلغة الصفحة (الإنجليزي اختياري من اللوحة؛ فاضي = العربي)
    address: pickLang(lang, s?.address ?? fallback.address, s?.address_en),
    hours: s ? (s.hours ? pickLang(lang, s.hours, s.hours_en) : null) : fallback.hours,
    social: s?.social ?? [...fallbackSocial],
    /** رابط واتساب برسالة جاهزة */
    whatsappHref: (message: string = whatsappTemplatesFor(lang).general) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`,
  };
}
