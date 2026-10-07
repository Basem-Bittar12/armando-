/**
 * مجموعة اختيار بأزرار (بدل قائمة <select> الخاصة بالنظام): كل الخيارات ظاهرة داخل اللوحة، تلتف على
 * أكثر من سطر، ولا شيء يطلع خارج الشاشة. اختيار واحد؛ الضغط على المختار يرجع لـ«الكل».
 */
export type Choice = { value: string; label: string };

export function ChoiceChips({
  label,
  allLabel,
  options,
  value,
  onChange,
}: {
  label: string;
  /** خيار «الكل» في أول الصف (قيمته "") */
  allLabel: string;
  options: Choice[];
  value: string;
  onChange: (value: string) => void;
}) {
  const all: Choice[] = [{ value: "", label: allLabel }, ...options];
  return (
    <fieldset className="choice-group">
      <legend>{label}</legend>
      <div className="choice-chips" role="radiogroup" aria-label={label}>
        {all.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value || "all"}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? "active" : ""}
              onClick={() => onChange(selected && option.value ? "" : option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default ChoiceChips;
