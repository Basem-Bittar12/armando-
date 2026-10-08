import { useRef, useState } from "react";
import { CheckCircle2, Clock3, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { pageMeta, whatsappTemplates } from "@/config/site";
import { useSiteContact } from "@/hooks/useSiteContact";
import { useCatalog, bySort } from "@/lib/catalog/store";
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

/** نوع الإيجار والمنطقة يبدآن فارغين («اختر») — النموذج لا يختار عن الزائر */
const initialForm: FormState = {
  name: "",
  phone: "",
  term: "",
  city: "",
  message: "",
};

export default function Contact() {
  useMeta(pageMeta.contact);
  const { data, submitInquiry } = useCatalog();
  const contact = useSiteContact();
  const { whatsappHref } = contact;
  // خيارات النموذج من الخيارات المفعّلة
  const rentalTerms = data ? bySort(data.rental_terms.filter((t) => t.is_active)).map((t) => t.name_ar) : [];
  const cities = data ? bySort(data.cities.filter((c) => c.is_active)).map((c) => c.name_ar) : [];
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  // فخّ السبام: حقل مخفي عن الإنسان؛ الروبوت يعبّيه
  const [website, setWebsite] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 3) next.name = "الرجاء كتابة الاسم الكامل";
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 9) next.phone = "الرجاء إدخال رقم هاتف صحيح";
    setErrors(next);
    return next;
  };

  // الرسالة الجاهزة: الزائر يرسلها بنفسه من واتساب، فتصل للمكتب فعلاً
  const message = whatsappTemplates.contactForm({
    name: form.name.trim(),
    phone: form.phone.trim(),
    term: form.term,
    city: form.city,
    message: form.message.trim(),
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    if (Object.keys(found).length > 0) {
      // الحقل الخاطئ قد يكون فوق الشاشة: نذهب إليه ونضع المؤشر فيه
      const field = found.name ? nameRef.current : phoneRef.current;
      field?.scrollIntoView({ block: "center", behavior: "smooth" });
      field?.focus({ preventScroll: true });
      toast.error("راجع الحقول المطلوبة قبل الإرسال");
      return;
    }
    // الحقل المخفي معبّى = روبوت: نُظهر النجاح بلا إرسال حتى لا نعطيه أي إشارة
    if (website) {
      setSent(true);
      return;
    }
    // الطلب ينحفظ بقائمة «الاستفسارات» باللوحة، والمكتب يتصل بالزائر
    setSending(true);
    try {
      await submitInquiry({
        name: form.name.trim(),
        phone: form.phone.trim(),
        rental_term: form.term || null,
        city: form.city || null,
        message: form.message.trim() || null,
        website,
      });
      setSent(true);
    } catch (error) {
      console.error("[Contact] inquiry not saved", error);
      toast.error("ما وصل الطلب — جرّب مرة ثانية أو راسلنا مباشرة على واتساب", {
        action: { label: "واتساب", onClick: () => window.open(whatsappHref(message), "_blank", "noopener") },
      });
    } finally {
      setSending(false);
    }
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
                  <Ltr>{contact.phone}</Ltr>
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
              <h2>وصلنا طلبك</h2>
              <p>
                شكراً {form.name.trim()}. منتواصل معك على الرقم <Ltr>{form.phone.trim()}</Ltr>. إذا حابب تحكي معنا هلأ،
                رسالتك جاهزة على واتساب.
              </p>
              <div className="contact-form__sent-actions">
                <WhatsAppButton label="أرسلها على واتساب" message={message} />
                <button
                  className="outline-button"
                  onClick={() => {
                    setForm(initialForm);
                    setWebsite("");
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
                <span>
                  الاسم الكامل <span aria-hidden="true">*</span>
                </span>
                <input
                  ref={nameRef}
                  aria-required="true"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="اكتب اسمك"
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <small className="field-error">{errors.name}</small>}
              </label>

              <label>
                <span>
                  رقم الهاتف <span aria-hidden="true">*</span>
                </span>
                <input
                  ref={phoneRef}
                  aria-required="true"
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
                    <option value="">اختر</option>
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
                    <option value="">اختر</option>
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

              {/* فخّ السبام: مخفي عن الزوار وقارئات الشاشة */}
              <label className="hp-field" aria-hidden="true">
                الموقع الإلكتروني
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} name="website" />
              </label>

              <button className="primary-button primary-button--large" type="submit" disabled={sending}>
                {sending ? "جاري الإرسال…" : "أرسل الطلب"}
              </button>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
