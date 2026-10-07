/** مفتاح تشغيل/إيقاف بحجم لمس مريح (44px) — مع نص يوضح الحالة */
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
  /** سبب التعطيل أو شرح قصير */
  hint?: string;
}) {
  return (
    <label className={`adm-toggle ${disabled ? "is-disabled" : ""}`} title={hint}>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="adm-toggle__track" aria-hidden="true">
        <span className="adm-toggle__thumb" />
      </span>
      <span className="adm-toggle__label">{label}</span>
    </label>
  );
}

export default Toggle;
