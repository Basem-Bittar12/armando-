import type { CatalogData } from "@/lib/catalog/types";

/**
 * نسخة احتياطية: كل العقارات (مع أسعارها وصورها ومرافقها) والخيارات والإعدادات بملف JSON واحد.
 * الصور نفسها تبقى بـ Supabase Storage؛ الملف فيه روابطها ومساراتها.
 */
export function downloadBackup(data: CatalogData) {
  const backup = {
    exported_at: new Date().toISOString(),
    site: "Armando Alkadi Holiday Homes",
    version: 1,
    settings: data.settings,
    cities: data.cities,
    areas: data.areas,
    property_types: data.property_types,
    rental_terms: data.rental_terms,
    amenities: data.amenities,
    properties: data.properties,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `armando-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
