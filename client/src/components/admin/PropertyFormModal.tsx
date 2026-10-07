import { useEffect, useMemo, useState } from "react";
import { Check, ImagePlus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  amenityOptions,
  cities,
  placeholderImages,
  propertyTypes,
  rentalTerms,
  statuses,
  type Property,
} from "@/data/properties";
import { useDemoStore, type PropertyDraft } from "@/store/DemoStore";

type Errors = Partial<Record<keyof PropertyDraft, string>>;

/**
 * نموذج إضافة/تعديل عقار.
 * يعمل بالكامل على الحالة المحلية — لا يوجد رفع صور حقيقي ولا حفظ على سيرفر.
 */
export function PropertyFormModal({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  /** العقار قيد التعديل، أو null لإضافة عقار جديد */
  editing: Property | null;
  onClose: () => void;
}) {
  const { addProperty, updateProperty, nextPropertyId, properties } = useDemoStore();

  const blankDraft = useMemo<PropertyDraft>(
    () => ({
      title: "",
      id: nextPropertyId(),
      price: "",
      term: "شهري",
      location: "",
      city: "دبي",
      type: "شقة",
      beds: 1,
      baths: 1,
      area: "",
      status: "متاح",
      description: "",
      amenities: [],
      imageCount: 0,
    }),
    [nextPropertyId],
  );

  const [draft, setDraft] = useState<PropertyDraft>(blankDraft);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editing) {
      setDraft({
        title: editing.title,
        id: editing.id,
        price: editing.price,
        term: editing.term,
        location: editing.location,
        city: editing.city,
        type: editing.type,
        beds: editing.beds,
        baths: editing.baths,
        area: editing.area,
        status: editing.status,
        description: editing.description,
        amenities: editing.amenities,
        imageCount: editing.gallery.length,
      });
    } else {
      setDraft(blankDraft);
    }
  }, [open, editing, blankDraft]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const validate = () => {
    const next: Errors = {};
    if (draft.title.trim().length < 4) next.title = "اكتب اسماً واضحاً للعقار";
    if (!/^AK-\d{3}$/.test(draft.id.trim())) next.id = "الصيغة المطلوبة: AK-000";
    if (!editing && properties.some((property) => property.id === draft.id.trim()))
      next.id = "هذا الكود مستخدم بالفعل";
    if (!Number(draft.price.replace(/[^\d]/g, ""))) next.price = "أدخل سعراً رقمياً";
    if (draft.location.trim().length < 3) next.location = "أدخل المنطقة";
    if (!draft.area.trim()) next.area = "أدخل المساحة";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = () => {
    if (!validate()) {
      toast.error("راجع الحقول المطلوبة");
      return;
    }
    if (editing) {
      updateProperty(editing.id, {
        title: draft.title.trim(),
        location: draft.location.trim(),
        city: draft.city,
        price: Number(draft.price.replace(/[^\d]/g, "")).toLocaleString("en-US"),
        priceValue: Number(draft.price.replace(/[^\d]/g, "")),
        term: draft.term,
        type: draft.type,
        beds: draft.beds,
        baths: draft.baths,
        area: draft.area.trim(),
        areaValue: Number(draft.area.replace(/[^\d]/g, "")) || 0,
        status: draft.status,
        description: draft.description.trim() || "لم يُضف وصف لهذا العقار بعد.",
        amenities: draft.amenities,
      });
      toast.success(`تم تحديث ${editing.id}`);
    } else {
      const created = addProperty(draft);
      toast.success(`تم نشر ${created.id} — يظهر الآن في الموقع`);
    }
    onClose();
  };

  const toggleAmenity = (amenity: string) => {
    setDraft((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  };

  /** «اختيار صور» تجريبي: يضيف صوراً جاهزة بدل رفع ملفات حقيقية */
  const pickImages = () => {
    setDraft((current) => ({
      ...current,
      imageCount: Math.min((current.imageCount || 0) + 2, placeholderImages.length),
    }));
    toast.info("تمت إضافة صور تجريبية — الرفع الحقيقي يحتاج تخزين صور");
  };

  const selectedImages = placeholderImages.slice(0, draft.imageCount);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="add-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <span className="eyebrow">{editing ? "EDIT LISTING" : "NEW LISTING"}</span>
            <h2>{editing ? `تعديل ${editing.id}` : "إضافة عقار جديد"}</h2>
          </div>
          <button className="icon-circle" onClick={onClose} aria-label="إغلاق">
            <X size={17} />
          </button>
        </div>

        <div className="modal-body">
          <div className="upload-zone">
            <ImagePlus size={24} />
            <strong>اسحب الصور هنا أو اختر من جهازك</strong>
            <span>PNG, JPG حتى 10MB · يمكنك رفع عدة صور</span>
            <button className="outline-button" type="button" onClick={pickImages}>
              <Upload size={15} /> اختيار الصور
            </button>
            <small className="upload-zone__note">
              في النسخة التجريبية تُستخدم صور جاهزة — الرفع الحقيقي يحتاج خدمة تخزين.
            </small>
          </div>

          {selectedImages.length > 0 && (
            <div className="upload-preview">
              {selectedImages.map((image, index) => (
                <div key={image + index}>
                  <img src={image} alt="" />
                  {index === 0 && <span>الغلاف</span>}
                </div>
              ))}
              <button
                className="upload-preview__clear"
                type="button"
                onClick={() => setDraft({ ...draft, imageCount: 0 })}
              >
                مسح الصور
              </button>
            </div>
          )}

          <div className="modal-form-grid">
            <label>
              اسم العقار
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="مثال: شقة بانورامية بإطلالة على المدينة"
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title && <small className="field-error">{errors.title}</small>}
            </label>

            <label>
              كود العقار
              <input
                value={draft.id}
                onChange={(event) => setDraft({ ...draft, id: event.target.value })}
                placeholder="AK-000"
                disabled={Boolean(editing)}
                aria-invalid={Boolean(errors.id)}
              />
              {errors.id && <small className="field-error">{errors.id}</small>}
            </label>

            <label>
              السعر (درهم)
              <input
                value={draft.price}
                onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                placeholder="0"
                inputMode="numeric"
                aria-invalid={Boolean(errors.price)}
              />
              {errors.price && <small className="field-error">{errors.price}</small>}
            </label>

            <label>
              نوع الإيجار
              <select
                value={draft.term}
                onChange={(event) => setDraft({ ...draft, term: event.target.value as PropertyDraft["term"] })}
              >
                {rentalTerms.map((term) => (
                  <option key={term}>{term}</option>
                ))}
              </select>
            </label>

            <label>
              المنطقة
              <input
                value={draft.location}
                onChange={(event) => setDraft({ ...draft, location: event.target.value })}
                placeholder="مثال: وسط مدينة دبي"
                aria-invalid={Boolean(errors.location)}
              />
              {errors.location && <small className="field-error">{errors.location}</small>}
            </label>

            <label>
              الإمارة
              <select
                value={draft.city}
                onChange={(event) => setDraft({ ...draft, city: event.target.value as PropertyDraft["city"] })}
              >
                {cities.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </label>

            <label>
              نوع العقار
              <select
                value={draft.type}
                onChange={(event) => setDraft({ ...draft, type: event.target.value as PropertyDraft["type"] })}
              >
                {propertyTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>

            <label>
              الحالة
              <select
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as PropertyDraft["status"] })}
              >
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label>
              غرف النوم
              <input
                type="number"
                min={0}
                max={10}
                value={draft.beds}
                onChange={(event) => setDraft({ ...draft, beds: Number(event.target.value) })}
              />
            </label>

            <label>
              الحمامات
              <input
                type="number"
                min={1}
                max={10}
                value={draft.baths}
                onChange={(event) => setDraft({ ...draft, baths: Number(event.target.value) })}
              />
            </label>

            <label>
              المساحة
              <input
                value={draft.area}
                onChange={(event) => setDraft({ ...draft, area: event.target.value })}
                placeholder="مثال: 1,420 قدم²"
                aria-invalid={Boolean(errors.area)}
              />
              {errors.area && <small className="field-error">{errors.area}</small>}
            </label>
          </div>

          <div className="amenity-picker">
            <span className="amenity-picker__label">المرافق</span>
            <div className="amenity-picker__options">
              {amenityOptions.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  className={draft.amenities.includes(amenity) ? "is-selected" : ""}
                  onClick={() => toggleAmenity(amenity)}
                  aria-pressed={draft.amenities.includes(amenity)}
                >
                  {draft.amenities.includes(amenity) && <Check size={13} />} {amenity}
                </button>
              ))}
            </div>
          </div>

          <label className="full-label">
            الوصف
            <textarea
              rows={3}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              placeholder="اكتب وصفاً مختصراً للعقار..."
            />
          </label>
        </div>

        <div className="modal-footer">
          <button className="outline-button" onClick={onClose}>
            إلغاء
          </button>
          <button className="primary-button" onClick={save}>
            <Check size={16} /> {editing ? "حفظ التعديلات" : "حفظ ونشر"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PropertyFormModal;
