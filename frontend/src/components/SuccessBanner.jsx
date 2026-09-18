import { CheckCircle2, X } from "lucide-react";

export const SuccessBanner = ({ title, children, onDismiss }) => (
  <div className="my-4 flex items-start gap-3 rounded-xl border border-moss/30 bg-moss-tint p-4 text-moss-deep dark:border-moss/60 dark:bg-moss/20 dark:text-moss-tint">
    <CheckCircle2 size={22} className="mt-0.5 shrink-0" aria-hidden="true" />
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="min-w-0 flex-1">
      <p className="font-semibold">{title}</p>
      {children && (
        <div className="mt-1 wrap-break-word text-sm">{children}</div>
      )}
    </div>
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss success message"
      className="-m-1 shrink-0 rounded-md p-2 hover:bg-moss/10">
      <X size={18} aria-hidden="true" />
    </button>
  </div>
);
