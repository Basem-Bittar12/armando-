/**
 * عقارات دبي الوهمية — تُرفع كعقارات تجريبية is_demo. الثلاثة الأولى منقولة كما هي من الواجهة القديمة،
 * والعقاران AK-110 وAK-118 أُضيفا ليكتمل شريط الرئيسية بخمسة كروت (بيانات تجريبية تُحذف قبل الإطلاق).
 * لا معلومات جديدة عن الشركة؛ الصور من Unsplash.
 */
const INTERIOR_A = "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=85";
const INTERIOR_B = "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=85";
const INTERIOR_C = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=85";

export type DemoProperty = {
  code: string;
  title: string;
  description: string;
  /** ترجمة إنجليزية للعقار التجريبي (النسخة الإنجليزية من الموقع) */
  titleEn: string;
  descriptionEn: string;
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
    titleEn: "Panoramic apartment with city views",
    descriptionEn:
      "A panoramic apartment in the heart of Downtown Dubai with open views of the city skyline. Spacious living areas, floor-to-ceiling windows and contemporary finishes in calm tones. Minutes from Dubai Mall and the metro station.",
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
    titleEn: "Private villa with contemporary design",
    descriptionEn:
      "A standalone villa with contemporary design in Al Barsha, set over two floors with a private garden and pool. Separate reception areas, a fitted kitchen and a maid's room. Ideal for families looking for privacy close to schools and shopping centres.",
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
    titleEn: "Elegant fully furnished studio",
    descriptionEn:
      "A fully furnished studio in Business Bay, ready to move in. A smart layout that makes the most of every metre, with a built-in kitchen and a view of the canal.",
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
  {
    code: "AK-110",
    title: "تاون هاوس عصري بحديقة",
    description:
      "تاون هاوس بتصميم عصري في البرشاء على ثلاثة طوابق، مع حديقة أمامية ومساحات معيشة مفتوحة يدخلها الضوء الطبيعي. غرف نوم واسعة وموقف خاص، ضمن مجمع هادئ قريب من الخدمات.",
    titleEn: "Modern townhouse with a garden",
    descriptionEn:
      "A modern townhouse in Al Barsha over three floors, with a front garden and open living spaces filled with natural light. Spacious bedrooms and private parking, in a quiet community close to everyday services.",
    city: "دبي",
    area: "البرشاء",
    type: "تاون هاوس",
    bedrooms: 3,
    bathrooms: 4,
    areaSqft: 2650,
    floor: null,
    yearBuilt: 2020,
    furnished: false,
    minRent: "سنة واحدة",
    status: "متاح",
    isNew: true,
    prices: [{ term: "سنوي", amount: 150000 }],
    amenities: ["حديقة خاصة", "موقف سيارة", "مجمع مغلق", "أمن 24 ساعة", "شرفة"],
    gallery: [
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1600&q=85",
    ],
  },
  {
    code: "AK-118",
    title: "شقة مشرقة بغرفة نوم واحدة",
    description:
      "شقة بغرفة نوم واحدة في الخليج التجاري، بنوافذ واسعة وإضاءة طبيعية طوال اليوم. صالة مريحة، مطبخ مجهز، وشرفة صغيرة. متاحة للإيجار الشهري أو السنوي.",
    titleEn: "Bright one-bedroom apartment",
    descriptionEn:
      "A one-bedroom apartment in Business Bay with wide windows and natural light all day. A comfortable living room, a fitted kitchen and a small balcony. Available for monthly or yearly rent.",
    city: "دبي",
    area: "الخليج التجاري",
    type: "شقة",
    bedrooms: 1,
    bathrooms: 1,
    areaSqft: 820,
    floor: "15",
    yearBuilt: 2018,
    furnished: true,
    minRent: "شهر واحد",
    status: "متاح",
    isNew: false,
    prices: [
      { term: "شهري", amount: 7200 },
      { term: "سنوي", amount: 78000 },
    ],
    amenities: ["موقف سيارة", "مسبح مشترك", "صالة رياضية", "شرفة", "قريب من المترو"],
    gallery: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85",
    ],
  },
];
