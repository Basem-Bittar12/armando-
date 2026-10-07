/**
 * بيانات لوحة المكتب الوهمية — Armando Alkadi
 * كل ما يظهر داخل /admin يأتي من هنا. لا يوجد أي اتصال بسيرفر.
 */

export type InquiryStatus = "جديد" | "تمت المتابعة" | "مغلق";
export type InquiryChannel = "واتساب" | "نموذج الموقع" | "اتصال";

export type Inquiry = {
  id: string;
  name: string;
  phone: string;
  /** كود العقار المرتبط بالاستفسار، أو null لاستفسار عام */
  propertyId: string | null;
  channel: InquiryChannel;
  message: string;
  receivedAt: string;
  status: InquiryStatus;
};

export const inquiries: Inquiry[] = [
  {
    id: "INQ-284",
    name: "خالد المنصوري",
    phone: "+971 50 118 2245",
    propertyId: "AK-087",
    channel: "واتساب",
    message: "مهتم بالفيلا في البرشاء. هل الإيجار قابل للدفع على أربع دفعات؟",
    receivedAt: "منذ 20 دقيقة",
    status: "جديد",
  },
  {
    id: "INQ-283",
    name: "Sara Haddad",
    phone: "+971 55 907 6610",
    propertyId: "AK-102",
    channel: "نموذج الموقع",
    message: "أبحث عن شقة غرفتين في وسط المدينة لمدة 6 أشهر. متى يمكن المعاينة؟",
    receivedAt: "منذ ساعة",
    status: "جديد",
  },
  {
    id: "INQ-281",
    name: "عبدالله الكعبي",
    phone: "+971 52 334 8890",
    propertyId: "AK-114",
    channel: "واتساب",
    message: "هل الجناح في الخان ما زال متاحاً من بداية الشهر القادم؟",
    receivedAt: "منذ 3 ساعات",
    status: "جديد",
  },
  {
    id: "INQ-279",
    name: "Maria Petrova",
    phone: "+971 56 220 4417",
    propertyId: "AK-095",
    channel: "نموذج الموقع",
    message: "Is the studio available for a 3-month lease? Fully furnished?",
    receivedAt: "منذ 5 ساعات",
    status: "جديد",
  },
  {
    id: "INQ-276",
    name: "فاطمة الزرعوني",
    phone: "+971 50 662 7781",
    propertyId: null,
    channel: "اتصال",
    message: "استفسار عام عن العقارات المتاحة في عجمان بميزانية 90 ألف سنوياً.",
    receivedAt: "أمس",
    status: "تمت المتابعة",
  },
  {
    id: "INQ-274",
    name: "Omar Youssef",
    phone: "+971 54 118 0092",
    propertyId: "AK-061",
    channel: "واتساب",
    message: "تم حجز التاون هاوس — أرجو إرسال نسخة من العقد.",
    receivedAt: "أمس",
    status: "تمت المتابعة",
  },
  {
    id: "INQ-268",
    name: "نورة الشحي",
    phone: "+971 58 445 3320",
    propertyId: "AK-073",
    channel: "نموذج الموقع",
    message: "هل يوجد خصم على الدفعة السنوية الكاملة؟",
    receivedAt: "منذ 3 أيام",
    status: "مغلق",
  },
  {
    id: "INQ-265",
    name: "Ravi Menon",
    phone: "+971 50 771 9934",
    propertyId: "AK-102",
    channel: "واتساب",
    message: "Requesting a viewing this weekend if possible.",
    receivedAt: "منذ 4 أيام",
    status: "مغلق",
  },
];

export type ActivityItem = {
  id: string;
  kind: "add" | "inquiry" | "edit";
  title: string;
  subtitle: string;
  time: string;
};

export const activity: ActivityItem[] = [
  {
    id: "ACT-1",
    kind: "add",
    title: "تمت إضافة عقار جديد",
    subtitle: "شقة بانورامية · وسط مدينة دبي",
    time: "منذ ساعتين",
  },
  {
    id: "ACT-2",
    kind: "inquiry",
    title: "استفسار جديد عبر واتساب",
    subtitle: "بخصوص AK-087 · فيلا خاصة",
    time: "منذ 4 ساعات",
  },
  {
    id: "ACT-3",
    kind: "edit",
    title: "تم تحديث بيانات عقار",
    subtitle: "استوديو أنيق · الخليج التجاري",
    time: "أمس",
  },
];

export type Notification = {
  id: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
};

export const notifications: Notification[] = [
  {
    id: "N-1",
    title: "استفسار جديد",
    detail: "خالد المنصوري — فيلا البرشاء AK-087",
    time: "منذ 20 دقيقة",
    unread: true,
  },
  {
    id: "N-2",
    title: "استفسار جديد",
    detail: "Sara Haddad — شقة وسط المدينة AK-102",
    time: "منذ ساعة",
    unread: true,
  },
  {
    id: "N-3",
    title: "تغيّرت حالة عقار",
    detail: "AK-061 أصبح محجوزاً",
    time: "أمس",
    unread: false,
  },
];

/** بطاقات الإحصائيات في صفحة النظرة العامة (أرقام العرض فقط) */
export const overviewStats = {
  inquiriesTotal: 86,
  inquiriesDelta: "+12% هذا الأسبوع",
  visitsTotal: "2,840",
  visitsDelta: "+18% هذا الشهر",
  addedThisMonth: "+3 هذا الشهر",
};

/** التاريخ المعروض في بطاقة الترحيب */
export const welcomeDate = "THURSDAY, 11 SEPTEMBER 2026";

export const adminAccount = {
  name: "Armando Alkadi",
  role: "حساب المدير",
  initials: "AK",
};
