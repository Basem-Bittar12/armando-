/**
 * حقول لوحة التحكم — مريحة باللمس (44px+)، وخيارات القوائم أزرار ظاهرة بدل قوائم النظام.
 */
import type { InputHTMLAttributes, ReactNode } from "react";
import { Minus, Plus } from "lucide-react";

export function Field({
  label,
  hint,
  error,
  children,
  wide = false,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`adm-field ${wide ? "adm-field--wide" : ""} ${error ? "has-error" : ""}`}>
      <span className="adm-field__label">{label}</span>
      {children}
      {hint && !error && <small className="adm-field__hint">{hint}</small>}
      {error && <small className="adm-field__error">{error}</small>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`adm-input ${props.className ?? ""}`} />;
}

/** اختيار واحد بأزرار */
export function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
  wide = false,
}: {
  label: string;
  options: { value: T; label: string; muted?: boolean }[];
  value: T | null;
  onChange: (value: T) => void;
  wide?: boolean;
}) {
  return (
    <fieldset className={`adm-field ${wide ? "adm-field--wide" : ""}`}>
      <legend className="adm-field__label">{label}</legend>
      <div className="adm-chips" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={`${value === option.value ? "active" : ""} ${option.muted ? "is-muted" : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** اختيار متعدد بأزرار */
export function MultiChips({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <fieldset className="adm-field adm-field--wide">
      <legend className="adm-field__label">{label}</legend>
      <div className="adm-chips" role="group" aria-label={label}>
        {options.map((option) => {
          const on = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={on}
              className={on ? "active" : ""}
              onClick={() => onChange(on ? values.filter((v) => v !== option.value) : [...values, option.value])}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** عدّاد بزرّين كبيرين (غرف، حمامات) */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 50,
  format,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  format?: (value: number) => string;
}) {
  return (
    <div className="adm-field">
      <span className="adm-field__label" id={`stepper-${label}`}>
        {label}
      </span>
      <div className="adm-stepper" role="group" aria-labelledby={`stepper-${label}`}>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`زيادة ${label}`} disabled={value >= max}>
          <Plus size={18} />
        </button>
        <output aria-live="polite">{format ? format(value) : value}</output>
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`إنقاص ${label}`} disabled={value <= min}>
          <Minus size={18} />
        </button>
      </div>
    </div>
  );
}
