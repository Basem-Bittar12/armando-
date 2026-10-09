import { createContext, useContext, type ReactNode } from "react";
import { whatsappTemplatesFor } from "@/config/site";
import { useLang } from "@/i18n/lang";

/**
 * رسالة واتساب الجاهزة للصفحة الحالية: كل صفحة تمررها لـ PublicLayout، فيستعملها الهيدر وشريط
 * الموبايل وأزرار واتساب داخل الصفحة. الافتراضي الرسالة العامة.
 */
const WhatsAppMessageContext = createContext<string | undefined>(undefined);

export function WhatsAppMessageProvider({ message, children }: { message?: string; children: ReactNode }) {
  return <WhatsAppMessageContext.Provider value={message}>{children}</WhatsAppMessageContext.Provider>;
}

/** رسالة الصفحة، أو الرسالة العامة بلغة الصفحة */
export function usePageWhatsAppMessage() {
  const lang = useLang();
  return useContext(WhatsAppMessageContext) ?? whatsappTemplatesFor(lang).general;
}

/** رقم أو كود أو عدّاد داخل نص عربي: اتجاه يسار-يمين معزول حتى لا تنقلب أجزاؤه */
export function Ltr({ children }: { children: ReactNode }) {
  return <bdi dir="ltr">{children}</bdi>;
}

/** العنوان: أي مقطع لاتيني (Aspin Commercial Tower) معزول ولا يُكسر على سطرين */
export function Address({ text }: { text: string }) {
  return (
    <>
      {text.split(/([A-Za-z][A-Za-z\s]*[A-Za-z])/).map((part, index) =>
        /[A-Za-z]/.test(part) ? (
          <bdi key={index} className="nowrap-latin">
            {part}
          </bdi>
        ) : (
          part
        ),
      )}
    </>
  );
}
