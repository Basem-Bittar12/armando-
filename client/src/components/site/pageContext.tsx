import { createContext, useContext, type ReactNode } from "react";
import { whatsappTemplates } from "@/config/site";

/**
 * رسالة واتساب الجاهزة للصفحة الحالية: كل صفحة تمررها لـ PublicLayout، فيستعملها الهيدر وشريط
 * الموبايل وأزرار واتساب داخل الصفحة. الافتراضي الرسالة العامة.
 */
const WhatsAppMessageContext = createContext<string>(whatsappTemplates.general);

export function WhatsAppMessageProvider({ message, children }: { message?: string; children: ReactNode }) {
  return (
    <WhatsAppMessageContext.Provider value={message ?? whatsappTemplates.general}>{children}</WhatsAppMessageContext.Provider>
  );
}

export const usePageWhatsAppMessage = () => useContext(WhatsAppMessageContext);

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
