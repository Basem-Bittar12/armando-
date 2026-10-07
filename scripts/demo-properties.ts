/**
 * عقارات دبي الوهمية الثلاثة (منقولة كما هي من بيانات الواجهة القديمة) — تُرفع كعقارات تجريبية is_demo.
 * لا معلومات جديدة عن الشركة؛ الصور من Unsplash كما كانت.
 */
const INTERIOR_A = "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=85";
const INTERIOR_B = "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=85";
const INTERIOR_C = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=85";

export type DemoProperty = {
  code: string;
  title: string;
  description: string;
  city: string;
  area: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  floor: string | null;
  yearBuilt: number;
  furnished: boolean;
  minRent: string;
  status: "متاح" | "محجوز" | "مؤجر";
  isNew: boolean;
  prices: { term: string; amount: number }[];
  amenities: string[];
  gallery: string[];
};

export const demoProperties: DemoProperty[] = [
  {
    code: "AK-102",
    title: "شقة بانورامية بإطلالة على المدينة",
    description:
      "شقة بانورامية في قلب وسط مدينة دبي، بإطلالة مفتوحة على أفق المدينة. مساحات معيشة واسعة، نوافذ ممتدة من الأرض حتى السقف، وتشطيبات معاصرة بألوان هادئة. على بعد دقائق من دبي مول ومحطة المترو.",
    city: "دبي",
    area: "وسط مدينة دبي",
    type: "شقة",
    bedrooms: 2,
    bathrooms: 2,
    areaSqft: 1420,
    floor: "24",
    yearBuilt: 2021,
    furnished: true,
    minRent: "3 أشهر",
    status: "متاح",
    isNew: true,
    prices: [{ term: "شهري", amount: 8500 }],
    amenities: ["موقف سيارة", "مسبح مشترك", "صالة رياضية", "أمن 24 ساعة", "شرفة"],
    gallery: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85",
      INTERIOR_A,
      INTERIOR_B,
      INTERIOR_C,
    ],
  },
  {
    code: "AK-087",
    title: "فيلا خاصة بتصميم معاصر",
    description:
      "فيلا مستقلة بتصميم معاصر في البرشاء، تتوزع على طابقين مع حديقة خاصة ومسبح. مساحات استقبال منفصلة، مطبخ مجهز، وغرفة خادمة. مناسبة للعائلات الباحثة عن الخصوصية مع قرب المدارس والمراكز التجارية.",
    city: "دبي",
    area: "البرشاء",
    type: "فيلا",
    bedrooms: 4,
    bathrooms: 5,
    areaSqft: 3800,
    floor: null,
    yearBuilt: 2019,
    furnished: false,
    minRent: "سنة واحدة",
    status: "متاح",
    isNew: false,
    prices: [{ term: "سنوي", amount: 185000 }],
    amenities: ["حديقة خاصة", "مسبح خاص", "موقف سيارة", "غرفة خادمة", "مجمع مغلق", "أمن 24 ساعة"],
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85",
      INTERIOR_B,
      INTERIOR_C,
      INTERIOR_A,
    ],
  },
  {
    code: "AK-095",
    title: "استوديو أنيق مفروش بالكامل",
    description:
      "استوديو مفروش بالكامل في الخليج التجاري، جاهز للسكن الفوري. تصميم ذكي يستثمر كامل المساحة، مع مطبخ مدمج وإطلالة على القناة المائية.",
    city: "دبي",
    area: "الخليج التجاري",
    type: "استوديو",
    bedrooms: 0,
    bathrooms: 1,
    areaSqft: 510,
    floor: "12",
    yearBuilt: 2023,
    furnished: true,
    minRent: "شهر واحد",
    status: "متاح",
    isNew: false,
    prices: [{ term: "شهري", amount: 4900 }],
    amenities: ["صالة رياضية", "مسبح مشترك", "موقف سيارة"],
    gallery: [
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=85",
      INTERIOR_B,
      INTERIOR_A,
      INTERIOR_C,
    ],
  },
];
