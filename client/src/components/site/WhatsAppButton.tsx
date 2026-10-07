import { whatsappHref, whatsappTemplates } from "@/config/site";
import type { Property } from "@/data/properties";
import { usePageWhatsAppMessage } from "./pageContext";
import WhatsAppIcon from "./WhatsAppIcon";

/**
 * زر واتساب — يفتح محادثة برسالة جاهزة.
 * الرسالة: message صريحة، أو حسب العقار، أو رسالة الصفحة الحالية (PublicLayout ← whatsappMessage).
 * الشكل الافتراضي: خلفية Espresso وأيقونة/نص Almond (لا أخضر)؛ variant يغيّر الشكل في أماكن محددة.
 */
export function WhatsAppButton({
  label = "تواصل عبر واتساب",
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
  const text =
    message ??
    (property
      ? intent === "viewing"
        ? whatsappTemplates.viewing(property.title, property.id)
        : whatsappTemplates.property(property.title, property.id, `${window.location.origin}/property/${property.id}`)
      : pageMessage);

  return (
    <a
      href={whatsappHref(text)}
      target="_blank"
      rel="noreferrer"
      className={`whatsapp-button ${variant !== "solid" ? `whatsapp-button--${variant}` : ""} ${className}`.trim()}
    >
      <WhatsAppIcon size={18} />
      {label}
    </a>
  );
}

export default WhatsAppButton;
