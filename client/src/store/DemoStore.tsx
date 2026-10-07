/**
 * ============================================================================
 *  DemoStore — الحالة المحلية للعرض التفاعلي
 * ============================================================================
 *  كل التفاعلات (إضافة عقار، تعديل، حذف، المفضلة، حالة الاستفسارات) تُحفظ هنا
 *  في ذاكرة المتصفح فقط. لا يوجد أي اتصال بسيرفر ولا حفظ دائم — تحديث الصفحة
 *  يُعيد كل شيء إلى البيانات الأصلية. هذا مقصود في مرحلة الـ demo.
 *
 *  عند بناء الباك اند لاحقاً: استبدل الدوال أدناه بنداءات API، وابقِ نفس
 *  الواجهة (signatures) حتى لا تتغير الصفحات.
 * ============================================================================
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  placeholderImages,
  properties as seedProperties,
  type Property,
  type PropertyStatus,
} from "@/data/properties";
import {
  inquiries as seedInquiries,
  notifications as seedNotifications,
  type Inquiry,
  type InquiryStatus,
  type Notification,
} from "@/data/admin";

/** الحقول التي يملؤها المستخدم في نموذج «إضافة عقار» */
export type PropertyDraft = {
  title: string;
  id: string;
  price: string;
  term: Property["term"];
  location: string;
  city: Property["city"];
  type: Property["type"];
  beds: number;
  baths: number;
  area: string;
  status: PropertyStatus;
  description: string;
  amenities: string[];
  /** أسماء الصور التي «اختارها» المستخدم — تُستبدل بصور جاهزة في الديمو */
  imageCount: number;
};

type DemoContextValue = {
  properties: Property[];
  addProperty: (draft: PropertyDraft) => Property;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  getProperty: (id: string) => Property | undefined;
  /** كود مقترح للعقار التالي، مثل AK-115 */
  nextPropertyId: () => string;

  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => boolean;

  inquiries: Inquiry[];
  setInquiryStatus: (id: string, status: InquiryStatus) => void;
  addInquiry: (input: { name: string; phone: string; message: string; propertyId?: string | null }) => void;

  notifications: Notification[];
  unreadCount: number;
  markNotificationsRead: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

const digitsOf = (value: string) => Number(value.replace(/[^\d]/g, "")) || 0;

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(seedProperties);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>(seedInquiries);
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications);

  const nextPropertyId = useCallback(() => {
    const highest = properties.reduce((max, property) => {
      const numeric = Number(property.id.replace(/\D/g, ""));
      return Number.isFinite(numeric) && numeric > max ? numeric : max;
    }, 0);
    return `AK-${String(highest + 1).padStart(3, "0")}`;
  }, [properties]);

  const addProperty = useCallback((draft: PropertyDraft) => {
    const gallery = placeholderImages.slice(0, Math.max(1, Math.min(draft.imageCount || 1, 4)));
    const property: Property = {
      id: draft.id.trim(),
      title: draft.title.trim(),
      location: draft.location.trim(),
      city: draft.city,
      price: digitsOf(draft.price).toLocaleString("en-US"),
      priceValue: digitsOf(draft.price),
      term: draft.term,
      type: draft.type,
      beds: draft.beds,
      baths: draft.baths,
      area: draft.area.trim() || "—",
      areaValue: digitsOf(draft.area),
      image: gallery[0],
      gallery,
      status: draft.status,
      description: draft.description.trim() || "لم يُضف وصف لهذا العقار بعد.",
      amenities: draft.amenities,
      details: [],
      new: true,
      updatedLabel: "الآن",
    };
    setProperties((current) => [property, ...current]);
    return property;
  }, []);

  const updateProperty = useCallback((id: string, patch: Partial<Property>) => {
    setProperties((current) =>
      current.map((property) =>
        property.id === id ? { ...property, ...patch, updatedLabel: "الآن" } : property,
      ),
    );
  }, []);

  const deleteProperty = useCallback((id: string) => {
    setProperties((current) => current.filter((property) => property.id !== id));
    setFavorites((current) => current.filter((favoriteId) => favoriteId !== id));
  }, []);

  const getProperty = useCallback(
    (id: string) => properties.find((property) => property.id === id),
    [properties],
  );

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  /** يرجّع true إذا أصبح العقار مفضلاً، و false إذا أُزيل */
  const toggleFavorite = useCallback((id: string) => {
    let added = false;
    setFavorites((current) => {
      added = !current.includes(id);
      return added ? [...current, id] : current.filter((favoriteId) => favoriteId !== id);
    });
    return !favorites.includes(id);
  }, [favorites]);

  const setInquiryStatus = useCallback((id: string, status: InquiryStatus) => {
    setInquiries((current) =>
      current.map((inquiry) => (inquiry.id === id ? { ...inquiry, status } : inquiry)),
    );
  }, []);

  const addInquiry = useCallback(
    (input: { name: string; phone: string; message: string; propertyId?: string | null }) => {
      setInquiries((current) => [
        {
          id: `INQ-${Math.floor(300 + Math.random() * 99)}`,
          name: input.name,
          phone: input.phone,
          propertyId: input.propertyId ?? null,
          channel: "نموذج الموقع",
          message: input.message || "—",
          receivedAt: "الآن",
          status: "جديد",
        },
        ...current,
      ]);
      setNotifications((current) => [
        {
          id: `N-${Date.now()}`,
          title: "استفسار جديد",
          detail: `${input.name} — عبر نموذج الموقع`,
          time: "الآن",
          unread: true,
        },
        ...current,
      ]);
    },
    [],
  );

  const markNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
  }, []);

  const unreadCount = notifications.filter((item) => item.unread).length;

  const value = useMemo<DemoContextValue>(
    () => ({
      properties,
      addProperty,
      updateProperty,
      deleteProperty,
      getProperty,
      nextPropertyId,
      favorites,
      isFavorite,
      toggleFavorite,
      inquiries,
      setInquiryStatus,
      addInquiry,
      notifications,
      unreadCount,
      markNotificationsRead,
    }),
    [
      properties,
      addProperty,
      updateProperty,
      deleteProperty,
      getProperty,
      nextPropertyId,
      favorites,
      isFavorite,
      toggleFavorite,
      inquiries,
      setInquiryStatus,
      addInquiry,
      notifications,
      unreadCount,
      markNotificationsRead,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoStore() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemoStore must be used inside <DemoStoreProvider>");
  }
  return context;
}
