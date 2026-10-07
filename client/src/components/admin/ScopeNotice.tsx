import { Info } from "lucide-react";

/**
 * شريط توضيحي يظهر في الصفحات التي تحتاج باك اند حقيقياً.
 * الغرض منه أن تكون الميزة واضحة أنها «قريباً» وليست معطّلة أو ناقصة تقنياً.
 */
export function ScopeNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="scope-notice">
      <span className="scope-notice__icon">
        <Info size={16} />
      </span>
      <div>
        <strong>
          {title} <b className="soon-tag">قريباً</b>
        </strong>
        <p>{body}</p>
      </div>
    </div>
  );
}

export default ScopeNotice;
