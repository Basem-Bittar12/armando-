/**
 * متجر الكتالوج: يحمّل البيانات من المصدر (محلي أو Supabase)، ويطبّق القواعد قبل أي حفظ:
 * كود لا يتكرر، حد عقارات الرئيسية، الخيار المستعمل لا يُحذف. الصفحات العامة ولوحة التحكم تقرأ منه.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { localBackend, type CatalogBackend } from "./backend";
import {
  CatalogError,
  type AreaRow,
  type CatalogData,
  type FullProperty,
  type ImageRow,
  type NewImage,
  type OptionKind,
  type OptionRow,
  type PropertyInput,
  type PropertyRow,
} from "./types";

type Status = "loading" | "ready" | "error";

type CatalogContextValue = {
  status: Status;
  data: CatalogData | null;
  backendKind: CatalogBackend["kind"];
  reload: () => void;
  saveProperty: (input: PropertyInput) => Promise<FullProperty>;
  deleteProperty: (id: string) => Promise<void>;
  setPublished: (id: string, value: boolean) => Promise<void>;
  setStatus: (id: string, value: PropertyRow["status"]) => Promise<void>;
  setOnHome: (id: string, value: boolean) => Promise<void>;
  reorderHome: (ids: string[]) => Promise<void>;
  setHomeCount: (count: number) => Promise<void>;
  deleteDemo: () => Promise<number>;
  saveOption: (kind: OptionKind, row: OptionRow | AreaRow) => Promise<void>;
  deleteOption: (kind: OptionKind, id: string) => Promise<void>;
  reorderOptions: (kind: OptionKind, ids: string[]) => Promise<void>;
  uploadAreaCover: (areaId: string, image: NewImage) => Promise<void>;
  /** كم عقاراً يستعمل هذا الخيار */
  usageCount: (kind: OptionKind, id: string) => number;
  nextCode: () => string;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function CatalogProvider({ children, backend: given }: { children: ReactNode; backend?: CatalogBackend }) {
  const backendRef = useRef<CatalogBackend>(given ?? localBackend());
  const backend = backendRef.current;
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<CatalogData | null>(null);
  const dataRef = useRef<CatalogData | null>(null);
  dataRef.current = data;
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    backend
      .load()
      .then((loaded) => {
        if (!alive) return;
        setData(loaded);
        setStatus("ready");
      })
      .catch((error) => {
        console.error("[Catalog] load failed", error);
        if (alive) setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, [backend, attempt]);

  const current = () => {
    if (!dataRef.current) throw new CatalogError("network", "البيانات لم تُحمّل بعد");
    return dataRef.current;
  };
  const commit = (next: CatalogData) => {
    dataRef.current = next;
    setData(next);
  };

  const usageCount = useCallback((kind: OptionKind, id: string) => {
    const d = dataRef.current;
    if (!d) return 0;
    switch (kind) {
      case "cities":
        return d.properties.filter((p) => p.city_id === id).length + d.areas.filter((a) => a.city_id === id).length;
      case "areas":
        return d.properties.filter((p) => p.area_id === id).length;
      case "property_types":
        return d.properties.filter((p) => p.type_id === id).length;
      case "rental_terms":
        return d.properties.filter((p) => p.prices.some((price) => price.rental_term_id === id)).length;
      case "amenities":
        return d.properties.filter((p) => p.amenity_ids.includes(id)).length;
    }
  }, []);

  const nextCode = useCallback(() => {
    const d = dataRef.current;
    const numbers = (d?.properties ?? []).map((p) => Number(/^AK-(\d+)$/.exec(p.code)?.[1] ?? 0));
    const next = Math.max(199, ...numbers) + 1;
    return `AK-${String(next).padStart(3, "0")}`;
  }, []);

  const homeCount = (d: CatalogData, exceptId?: string) => d.properties.filter((p) => p.show_on_home && p.id !== exceptId).length;

  const saveProperty = useCallback(async (input: PropertyInput) => {
    const d = current();
    const code = input.code.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{1,19}$/.test(code)) throw new CatalogError("invalid", "الكود لازم يكون أحرف إنجليزية وأرقام وشرطة، مثل AK-205");
    if (d.properties.some((p) => p.code === code && p.id !== input.id)) throw new CatalogError("code_taken", `الكود ${code} مستعمل لعقار آخر`);
    const existing = input.id ? d.properties.find((p) => p.id === input.id) : undefined;
    if (input.show_on_home && !existing?.show_on_home && homeCount(d, input.id) >= d.settings.home_count) {
      throw new CatalogError("home_limit", `وصلت للحد (${d.settings.home_count} عقارات بالرئيسية). شيل عقاراً منها أو كبّر العدد من صفحة «الرئيسية».`);
    }
    const newImages: NewImage[] = [];
    const images: ImageRow[] = input.images.map((draft, index) => {
      if (draft.kind === "saved") return { ...draft.image, sort_order: index };
      newImages.push(draft.image);
      return { id: draft.image.id, sort_order: index, src_640: draft.image.preview, src_1080: draft.image.preview, src_1600: draft.image.preview };
    });
    const keptIds = new Set(images.map((image) => image.id));
    const removedImages = (existing?.images ?? []).filter((image) => !keptIds.has(image.id));
    const maxOrder = Math.max(0, ...d.properties.filter((p) => p.show_on_home).map((p) => p.home_order));
    const { images: _draftImages, id: _id, ...fields } = input;
    const property: FullProperty = {
      ...fields,
      id: existing?.id ?? newId(),
      code,
      images,
      home_order: input.show_on_home ? (existing?.show_on_home ? existing.home_order : maxOrder + 1) : 0,
      is_demo: existing?.is_demo ?? false,
      updated_at: new Date().toISOString(),
    };
    const saved = await backend.saveProperty(property, newImages, removedImages);
    const after = current();
    commit({
      ...after,
      properties: existing ? after.properties.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...after.properties],
    });
    return saved;
  }, [backend]);

  const deleteProperty = useCallback(async (id: string) => {
    const d = current();
    const property = d.properties.find((p) => p.id === id);
    if (!property) return;
    await backend.deleteProperty(property);
    const after = current();
    commit({ ...after, properties: after.properties.filter((p) => p.id !== id) });
  }, [backend]);

  const patch = async (patches: { id: string; patch: Partial<FullProperty> }[]) => {
    await backend.patchProperties(patches);
    const after = current();
    const byId = new Map(patches.map((item) => [item.id, item.patch]));
    commit({
      ...after,
      properties: after.properties.map((p) => (byId.has(p.id) ? { ...p, ...byId.get(p.id), updated_at: new Date().toISOString() } : p)),
    });
  };

  const setPublished = useCallback((id: string, value: boolean) => patch([{ id, patch: { is_published: value } }]), [backend]);
  const setStatus_ = useCallback((id: string, value: PropertyRow["status"]) => patch([{ id, patch: { status: value } }]), [backend]);

  const setOnHome = useCallback(async (id: string, value: boolean) => {
    const d = current();
    if (value && homeCount(d, id) >= d.settings.home_count) {
      throw new CatalogError("home_limit", `وصلت للحد (${d.settings.home_count} عقارات بالرئيسية). شيل عقاراً منها أو كبّر العدد من صفحة «الرئيسية».`);
    }
    const maxOrder = Math.max(0, ...d.properties.filter((p) => p.show_on_home).map((p) => p.home_order));
    await patch([{ id, patch: { show_on_home: value, home_order: value ? maxOrder + 1 : 0 } }]);
  }, [backend]);

  const reorderHome = useCallback((ids: string[]) => patch(ids.map((id, index) => ({ id, patch: { home_order: index + 1 } }))), [backend]);

  const setHomeCount = useCallback(async (count: number) => {
    const value = Math.min(24, Math.max(1, Math.round(count)));
    await backend.saveSettings({ home_count: value });
    const after = current();
    commit({ ...after, settings: { home_count: value } });
  }, [backend]);

  const deleteDemo = useCallback(async () => {
    const demos = current().properties.filter((p) => p.is_demo);
    for (const property of demos) await deleteProperty(property.id);
    return demos.length;
  }, [deleteProperty]);

  const saveOption = useCallback(async (kind: OptionKind, row: OptionRow | AreaRow) => {
    if (!row.name_ar.trim()) throw new CatalogError("invalid", "الاسم العربي مطلوب");
    const d = current();
    const list = d[kind] as (OptionRow | AreaRow)[];
    const exists = list.some((item) => item.id === row.id);
    const toSave = exists ? row : { ...row, id: row.id || newId(), sort_order: Math.max(0, ...list.map((item) => item.sort_order)) + 1 };
    const saved = await backend.saveOption(kind, toSave);
    const after = current();
    const afterList = after[kind] as (OptionRow | AreaRow)[];
    commit({ ...after, [kind]: exists ? afterList.map((item) => (item.id === saved.id ? saved : item)) : [...afterList, saved] });
  }, [backend]);

  const deleteOption = useCallback(async (kind: OptionKind, id: string) => {
    const used = usageCount(kind, id);
    if (used > 0) throw new CatalogError("in_use", `هذا الخيار مستعمل (${used}) — أوقفه بدل الحذف`);
    await backend.deleteOption(kind, id);
    const after = current();
    commit({ ...after, [kind]: (after[kind] as OptionRow[]).filter((item) => item.id !== id) });
  }, [backend, usageCount]);

  const reorderOptions = useCallback(async (kind: OptionKind, ids: string[]) => {
    await backend.reorderOptions(kind, ids);
    const after = current();
    const order = new Map(ids.map((id, index) => [id, index + 1]));
    commit({ ...after, [kind]: (after[kind] as OptionRow[]).map((item) => ({ ...item, sort_order: order.get(item.id) ?? item.sort_order })) });
  }, [backend]);

  const uploadAreaCover = useCallback(async (areaId: string, image: NewImage) => {
    const url = await backend.uploadAreaCover(areaId, image);
    const after = current();
    commit({ ...after, areas: after.areas.map((area) => (area.id === areaId ? { ...area, cover_url: url } : area)) });
  }, [backend]);

  const value = useMemo<CatalogContextValue>(
    () => ({
      status,
      data,
      backendKind: backend.kind,
      reload: () => setAttempt((n) => n + 1),
      saveProperty,
      deleteProperty,
      setPublished,
      setStatus: setStatus_,
      setOnHome,
      reorderHome,
      setHomeCount,
      deleteDemo,
      saveOption,
      deleteOption,
      reorderOptions,
      uploadAreaCover,
      usageCount,
      nextCode,
    }),
    [status, data, backend, saveProperty, deleteProperty, setPublished, setStatus_, setOnHome, reorderHome, setHomeCount, deleteDemo, saveOption, deleteOption, reorderOptions, uploadAreaCover, usageCount, nextCode],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return context;
}

/** ترتيب الخيارات للعرض */
export const bySort = <T extends { sort_order: number }>(list: T[]) => [...list].sort((a, b) => a.sort_order - b.sort_order);
