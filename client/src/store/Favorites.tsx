/**
 * المفضلة: محفوظة بمتصفح الزائر فقط (localStorage) — راحة شخصية، لا تصل لأحد.
 * المعرّف هو كود العقار (AK-102).
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

const KEY = "aahh:favorites";

const read = (): string[] => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
};

type FavoritesValue = {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  /** يعيد true إن أُضيف */
  toggleFavorite: (id: string) => boolean;
};

const FavoritesContext = createContext<FavoritesValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(read);
  const latest = useRef(favorites);
  latest.current = favorites;

  const toggleFavorite = useCallback((id: string) => {
    const added = !latest.current.includes(id);
    const next = added ? [...latest.current, id] : latest.current.filter((item) => item !== id);
    latest.current = next;
    setFavorites(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // التخزين غير متاح — تبقى بالذاكرة لهذه الجلسة
    }
    return added;
  }, []);

  const value = useMemo(
    () => ({ favorites, isFavorite: (id: string) => favorites.includes(id), toggleFavorite }),
    [favorites, toggleFavorite],
  );
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return context;
}
