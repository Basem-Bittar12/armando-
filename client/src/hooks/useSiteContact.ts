import { contact as fallback, social as fallbackSocial, whatsappTemplates } from "@/config/site";
import { useCatalog } from "@/lib/catalog/store";

/**
 * معلومات التواصل كما يحفظها صاحب الموقع من اللوحة (جدول settings).
 * قبل وصول البيانات (أو بدون Supabase) نستعمل القيم الافتراضية من config/site.ts.
 */
export function useSiteContact() {
  const { data } = useCatalog();
  const s = data?.settings;
  const phone = s?.phone ?? fallback.phoneDisplay;
  const whatsapp = s?.whatsapp || fallback.whatsapp;
  return {
    phone,
    /** للرابط tel: — أرقام فقط مع + بالبداية */
    phoneHref: phone ? `${phone.trim().startsWith("+") ? "+" : ""}${phone.replace(/\D/g, "")}` : "",
    whatsapp,
    email: s ? s.email : fallback.email,
    address: s?.address ?? fallback.address,
    hours: s ? s.hours : fallback.hours,
    social: s?.social ?? [...fallbackSocial],
    /** رابط واتساب برسالة جاهزة */
    whatsappHref: (message: string = whatsappTemplates.general) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`,
  };
}
