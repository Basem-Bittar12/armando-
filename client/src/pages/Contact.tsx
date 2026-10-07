import { useState } from "react";
import { CheckCircle2, Clock3, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { contact, pageMeta } from "@/config/site";
import { cities, rentalTerms } from "@/data/properties";
import { useDemoStore } from "@/store/DemoStore";
import { useMeta } from "@/hooks/useMeta";
import PublicLayout from "@/components/site/PublicLayout";
import WhatsAppButton from "@/components/site/WhatsAppButton";
import { Address, Ltr } from "@/components/site/pageContext";

type FormState = {
  name: string;
  phone: string;
  term: string;
  city: string;
  message: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  term: rentalTerms[0],
  city: cities[0],
  message: "",
};

export default function Contact() {
  useMeta(pageMeta.contact);
  const { addInquiry } = useDemoStore();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [sent, setSent] = useState(false);

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 3) next.name = "الرجاء كتابة الاسم الكامل";
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 9) next.phone = "الرجاء إدخال رقم هاتف صحيح";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      toast.error("راجع الحقول المطلوبة قبل الإرسال");
      return;
    }
    // في هذه النسخة التجريبية يُضاف الطلب إلى استفسارات لوحة المكتب محلياً فقط
    addInquiry({
      name: form.name.trim(),
      phone: form.phone.trim(),
      message: `${form.term} · ${form.city} — ${form.message.trim() || "بدون تفاصيل إضافية"}`,
    });
    setSent(true);
    toast.success("شكراً، تم إرسال طلبك بنجاح");
  };

  return (
    <PublicLayout>
      <div className="contact-page">
        <div className="container contact-layout">
          {/* العنوان، ثم واتساب مباشرة (القناة الأساسية)، ثم جملة النموذج، ثم النموذج */}
          <div className="contact-intro">
            <h1>
              لنبدأ
              <br />
              المحادثة
            </h1>
            <WhatsAppButton label="تواصل عبر واتساب" className="contact-whatsapp" />
            <p className="contact-or">أو اترك رقمك ومنتصل فيك</p>
          </div>

          <div className="contact-info">
            <div className="contact-details">
              <div>
                <span>
                  <Phone size={14} /> اتصل بنا
                </span>
                <a href={`tel:${contact.phoneHref}`}>
                  <Ltr>{contact.phoneDisplay}</Ltr>
                </a>
              </div>
              {/* البريد وساعات العمل مخفيان حتى تصل البيانات الحقيقية (config/site.ts) */}
              {contact.email && (
                <div>
                  <span>
                    <Mail size={14} /> راسلنا
                  </span>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </div>
              )}
              {contact.hours && (
                <div>
                  <span>
                    <Clock3 size={14} /> ساعات العمل
                  </span>
                  <strong>{contact.hours}</strong>
                </div>
              )}
              <div>
                <span>
                  <MapPin size={14} /> المكتب
                </span>
                <strong>
                  <Address text={contact.address} />
                </strong>
              </div>
            </div>
          </div>

          {sent ? (
            <div className="contact-form contact-form--sent">
              <CheckCircle2 size={34} />
              <h2>تم استلام طلبك</h2>
              <p>
                شكراً {form.name.trim()}. سيتواصل معك أحد مستشارينا على الرقم <Ltr>{form.phone.trim()}</Ltr>
                {contact.hours ? ` خلال ساعات العمل (${contact.hours}).` : " في أقرب وقت."}
              </p>
              <div className="contact-form__sent-actions">
                <WhatsAppButton label="تحدث معنا الآن عبر واتساب" />
                <button
                  className="outline-button"
                  onClick={() => {
                    setForm(initialForm);
                    setSent(false);
                  }}
                >
                  إرسال طلب آخر
                </button>
              </div>
            </div>
          ) : (
            <form className="contact-form" onSubmit={submit} noValidate>
              <div className="form-heading">
                <h2>ما الذي تبحث عنه؟</h2>
              </div>

              <label>
                الاسم الكامل
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="اكتب اسمك"
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <small className="field-error">{errors.name}</small>}
              </label>

              <label>
                رقم الهاتف
                <input
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="+971 50 000 0000"
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  inputMode="tel"
                  aria-invalid={Boolean(errors.phone)}
                />
                {errors.phone && <small className="field-error">{errors.phone}</small>}
              </label>

              <div className="form-row">
                <label>
                  نوع الإيجار
                  <select
                    value={form.term}
                    onChange={(event) => setForm({ ...form, term: event.target.value })}
                  >
                    {rentalTerms.map((term) => (
                      <option key={term}>{term}</option>
                    ))}
                  </select>
                </label>
                <label>
                  المنطقة
                  <select
                    value={form.city}
                    onChange={(event) => setForm({ ...form, city: event.target.value })}
                  >
                    {cities.map((city) => (
                      <option key={city}>{city}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                رسالتك
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  placeholder="شاركنا تفاصيل المساحة التي تتخيلها..."
                />
              </label>

              <button className="primary-button primary-button--large" type="submit">
                إرسال الطلب
              </button>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
