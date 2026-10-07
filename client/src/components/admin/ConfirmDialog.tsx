import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * نافذة تأكيد داخل الصفحة (بديل window.confirm حتى لا يعتمد الديمو على نوافذ المتصفح).
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "neutral";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div className="confirm-dialog__title">
            <span className={`confirm-dialog__icon confirm-dialog__icon--${tone}`}>
              <AlertTriangle size={16} />
            </span>
            <h2>{title}</h2>
          </div>
          <button className="icon-circle" onClick={onCancel} aria-label="إغلاق">
            <X size={17} />
          </button>
        </div>
        <div className="confirm-dialog__body">{body}</div>
        <div className="modal-footer">
          <button className="outline-button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={tone === "danger" ? "danger-button" : "primary-button"} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
