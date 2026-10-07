import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { resizeImage } from "@/lib/imageResize";
import type { DraftImage } from "@/lib/catalog/types";
import { SortableList } from "./Sortable";

const srcOf = (image: DraftImage) => (image.kind === "saved" ? image.image.src_640 : image.image.preview);
const idOf = (image: DraftImage) => image.image.id;

/**
 * صور العقار داخل الفورم: رفع عدة صور مرة واحدة (كمبيوتر أو تلفون/كاميرا)، تصغير كل صورة بالمتصفح لثلاث
 * نسخ WebP قبل الرفع، ترتيب بالسحب (الأولى = الغلاف)، وحذف. الرفع والحذف الفعليان يتمّان عند حفظ العقار.
 */
export function ImageManager({ images, onChange }: { images: DraftImage[]; onChange: (images: DraftImage[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null);
  const latest = useRef(images);
  latest.current = images;

  const addFiles = async (files: FileList | null) => {
    const list = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!list.length) return;
    setBusy({ done: 0, total: list.length });
    const added: DraftImage[] = [];
    for (let index = 0; index < list.length; index++) {
      const file = list[index];
      try {
        added.push({ kind: "new", image: await resizeImage(file) });
      } catch (error) {
        console.error("[ImageManager]", error);
        toast.error(`ما قدرت أجهّز الصورة ${file.name}`);
      }
      setBusy({ done: index + 1, total: list.length });
    }
    onChange([...latest.current, ...added]);
    setBusy(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const items = images.map((image) => ({ id: idOf(image), image }));

  return (
    <div className="adm-images">
      {items.length > 0 && (
        <SortableList
          items={items}
          layout="grid"
          className="adm-images__grid"
          itemClassName="adm-images__item"
          onReorder={(ids) => onChange(ids.map((id) => images.find((image) => idOf(image) === id)!))}
          renderItem={(item, handle, index) => (
            <>
              <img src={srcOf(item.image)} alt="" draggable={false} />
              {index === 0 && <span className="adm-images__cover">الغلاف</span>}
              {item.image.kind === "new" && <span className="adm-images__new">جديدة</span>}
              <div className="adm-images__bar">
                {handle}
                <button
                  type="button"
                  className="adm-images__remove"
                  aria-label={`حذف الصورة ${index + 1}`}
                  onClick={() => onChange(images.filter((image) => idOf(image) !== item.id))}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </>
          )}
        />
      )}

      <button type="button" className="adm-images__add" onClick={() => inputRef.current?.click()} disabled={Boolean(busy)}>
        <ImagePlus size={22} />
        {busy ? (
          <span>
            جاري تجهيز الصور {busy.done} من {busy.total}…
            <progress value={busy.done} max={busy.total} />
          </span>
        ) : (
          <span>{items.length ? "إضافة صور" : "إضافة صور — اختار عدة صور مرة وحدة"}</span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => addFiles(event.target.files)}
        data-testid="image-input"
      />
      <p className="adm-field__hint">اسحب من المقبض لترتيب الصور. الصورة الأولى هي الغلاف وهي اللي بتطلع بالموقع وبشريط الرئيسية.</p>
    </div>
  );
}

export default ImageManager;
