import { whatsappTemplatesFor } from "@/config/site";
import { propertyUrl, useLang } from "@/i18n/lang";
import { useSiteContact } from "@/hooks/useSiteContact";
import type { Property } from "@/lib/catalog/view";
import { usePageWhatsAppMessage } from "./pageContext";
import WhatsAppIcon from "./WhatsAppIcon";

/**
 * زر واتساب — يفتح محادثة برسالة جاهزة.
 * الرسالة: message صريحة، أو حسب العقار، أو رسالة الصفحة الحالية (PublicLayout ← whatsappMessage).
 * الشكل الافتراضي: خلفية Espresso وأيقونة/نص Almond (لا أخضر)؛ variant يغيّر الشكل في أماكن محددة.
 */
export function WhatsAppButton({
  label,
  property,
  intent = "inquiry",
  message,
  variant = "solid",
  className = "",
}: {
  label?: string;
  property?: Property;
  intent?: "inquiry" | "viewing";
  message?: string;
  variant?: "solid" | "outline" | "light";
  className?: string;
}) {
  const pageMessage = usePageWhatsAppMessage();
  const lang = useLang();
  const templates = whatsappTemplatesFor(lang);
  const { whatsappHref } = useSiteContact();
  const text =
    message ??
    (property
      ? intent === "viewing"
        ? templates.viewing(property.title, property.id)
        : templates.property(property.title, property.id, propertyUrl(lang, property.id))
      : pageMessage);

  return (
    <a
      href={whatsappHref(text)}
      target="_blank"
      rel="noreferrer"
      className={`whatsapp-button ${variant !== "solid" ? `whatsapp-button--${variant}` : ""} ${className}`.trim()}
    >
      <WhatsAppIcon size={18} />
      {label ?? (lang === "en" ? "Contact us on WhatsApp" : "تواصل عبر واتساب")}
    </a>
  );
}

export default WhatsAppButton;
