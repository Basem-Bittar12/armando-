/**
 * قائمة العقارات الوهمية — Armando Alkadi
 * لاستبدالها ببيانات حقيقية: غيّر هذا المصفوف فقط (أو اربطه بـ API لاحقاً).
 */

export type RentalTerm = "شهري" | "سنوي";
export type PropertyStatus = "متاح" | "محجوز" | "مؤجر";
export type PropertyType = "شقة" | "فيلا" | "استوديو" | "تاون هاوس";
/** حالياً دبي فقط */
export type City = "دبي";

export type Property = {
  id: string;
  title: string;
  location: string;
  /** يُستخدم في الفلترة حسب الإمارة */
  city: City;
  /** السعر بصيغة العرض (مع الفواصل) */
  price: string;
  /** نفس السعر كرقم — للفلترة والترتيب */
  priceValue: number;
  term: RentalTerm;
  type: PropertyType;
  beds: number;
  baths: number;
  /** المساحة بصيغة العرض */
  area: string;
  /** المساحة كرقم بالقدم المربع — للترتيب */
  areaValue: number;
  /** صورة الغلاف */
  image: string;
  /** صور المعرض (تبدأ بصورة الغلاف) */
  gallery: string[];
  status: PropertyStatus;
  description: string;
  amenities: string[];
  /** متاح من تاريخ (نص كما يكتبه المكتب، مثل «1 نوفمبر 2026») — اختياري، لا يظهر شيء بدونه */
  availableFrom?: string;
  /** تفاصيل إضافية تظهر في صفحة العقار */
  details: { label: string; value: string }[];
  featured?: boolean;
  new?: boolean;
  /** نص وصفي لآخر تحديث — يظهر في جدول لوحة المكتب */
  updatedLabel: string;
};

const INTERIOR_A =
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=85";
const INTERIOR_B =
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=85";
const INTERIOR_C =
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=85";

export const properties: Property[] = [
  {
    id: "AK-102",
    title: "شقة بانورامية بإطلالة على المدينة",
    location: "وسط مدينة دبي، الإمارات",
    city: "دبي",
    price: "8,500",
    priceValue: 8500,
    term: "شهري",
    type: "شقة",
    beds: 2,
    baths: 2,
    area: "1,420 قدم²",
    areaValue: 1420,
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85",
      INTERIOR_A,
      INTERIOR_B,
      INTERIOR_C,
    ],
    status: "متاح",
    description:
      "شقة بانورامية في قلب وسط مدينة دبي، بإطلالة مفتوحة على أفق المدينة. مساحات معيشة واسعة، نوافذ ممتدة من الأرض حتى السقف، وتشطيبات معاصرة بألوان هادئة. على بعد دقائق من دبي مول ومحطة المترو.",
    amenities: ["مفروشة بالكامل", "موقف سيارة", "مسبح مشترك", "صالة رياضية", "أمن 24 ساعة", "شرفة"],
    details: [
      { label: "الطابق", value: "الطابق 24" },
      { label: "سنة البناء", value: "2021" },
      { label: "الحد الأدنى للإيجار", value: "3 أشهر" },
      { label: "التأثيث", value: "مفروشة بالكامل" },
    ],
    featured: true,
    new: true,
    updatedLabel: "منذ ساعتين",
  },
  {
    id: "AK-087",
    title: "فيلا خاصة بتصميم معاصر",
    location: "البرشاء، دبي",
    city: "دبي",
    price: "185,000",
    priceValue: 185000,
    term: "سنوي",
    type: "فيلا",
    beds: 4,
    baths: 5,
    area: "3,800 قدم²",
    areaValue: 3800,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85",
      INTERIOR_B,
      INTERIOR_C,
      INTERIOR_A,
    ],
    status: "متاح",
    description:
      "فيلا مستقلة بتصميم معاصر في البرشاء، تتوزع على طابقين مع حديقة خاصة ومسبح. مساحات استقبال منفصلة، مطبخ مجهز، وغرفة خادمة. مناسبة للعائلات الباحثة عن الخصوصية مع قرب المدارس والمراكز التجارية.",
    amenities: [
      "حديقة خاصة",
      "مسبح خاص",
      "موقف سيارة",
      "غرفة خادمة",
      "مجمع مغلق",
      "أمن 24 ساعة",
    ],
    details: [
      { label: "عدد الطوابق", value: "طابقان" },
      { label: "سنة البناء", value: "2019" },
      { label: "الحد الأدنى للإيجار", value: "سنة واحدة" },
      { label: "التأثيث", value: "غير مفروشة" },
    ],
    featured: true,
    updatedLabel: "منذ يومين",
  },
  {
    id: "AK-095",
    title: "استوديو أنيق مفروش بالكامل",
    location: "الخليج التجاري، دبي",
    city: "دبي",
    price: "4,900",
    priceValue: 4900,
    term: "شهري",
    type: "استوديو",
    beds: 0,
    baths: 1,
    area: "510 قدم²",
    areaValue: 510,
    image:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=85",
      INTERIOR_B,
      INTERIOR_A,
      INTERIOR_C,
    ],
    status: "متاح",
    description:
      "استوديو مفروش بالكامل في الخليج التجاري، جاهز للسكن الفوري. تصميم ذكي يستثمر كامل المساحة، مع مطبخ مدمج وإطلالة على القناة المائية.",
    amenities: ["مفروشة بالكامل", "صالة رياضية", "مسبح مشترك", "موقف سيارة"],
    details: [
      { label: "الطابق", value: "الطابق 12" },
      { label: "سنة البناء", value: "2023" },
      { label: "الحد الأدنى للإيجار", value: "شهر واحد" },
      { label: "التأثيث", value: "مفروش بالكامل" },
    ],
    updatedLabel: "منذ أسبوع",
  },
];

export const neighborhoods = [
  {
    name: "وسط مدينة دبي",
    count: "24 عقار",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=85",
    /** الفلتر الذي يُطبّق عند الضغط على البطاقة */
    query: "?q=وسط مدينة دبي",
  },
  {
    name: "البرشاء",
    count: "18 عقار",
    image:
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=900&q=85",
    query: "?q=البرشاء",
  },
  {
    name: "الخليج التجاري",
    count: "12 عقار",
    image:
      "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=900&q=85",
    query: "?q=الخليج التجاري",
  },
];

export const propertyTypes: PropertyType[] = ["شقة", "فيلا", "استوديو", "تاون هاوس"];
export const cities: City[] = ["دبي"];
export const rentalTerms: RentalTerm[] = ["شهري", "سنوي"];
export const statuses: PropertyStatus[] = ["متاح", "محجوز", "مؤجر"];

/** قائمة المرافق المتاحة عند إضافة عقار جديد من لوحة المكتب */
export const amenityOptions = [
  "مفروشة بالكامل",
  "موقف سيارة",
  "مسبح مشترك",
  "مسبح خاص",
  "حديقة خاصة",
  "صالة رياضية",
  "أمن 24 ساعة",
  "شرفة",
  "غرفة خادمة",
  "قريب من المترو",
  "إطلالة بحرية",
  "مجمع مغلق",
];

/** صور جاهزة تُستخدم كغلاف افتراضي عند إضافة عقار من لوحة المكتب (لا يوجد رفع حقيقي) */
export const placeholderImages = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85",
  INTERIOR_A,
  INTERIOR_B,
  INTERIOR_C,
];
