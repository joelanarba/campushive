import { cn } from "../lib/cn";

const styles = {
  pending: {
    bg: "bg-(--color-honey-tint)",
    border: "border-(--color-honey-deep)",
    text: "text-(--color-honey-deep)",
    label: "Pending verification",
  },
  verified: {
    bg: "bg-(--color-moss-tint)",
    border: "border-(--color-moss)",
    text: "text-(--color-moss-deep)",
    label: "Verified",
  },
  rejected: {
    bg: "bg-(--color-clay-tint)",
    border: "border-(--color-clay)",
    text: "text-(--color-clay-deep)",
    label: "Rejected",
  },
  suspended: {
    bg: "bg-(--color-clay-tint)",
    border: "border-(--color-clay)",
    text: "text-(--color-clay-deep)",
    label: "Suspended",
  },
};

export function StatusBanner({ status, reason, nextStep }) {
  const s = styles[status] || styles.pending;
  return (
    <div
      role="status"
      className={cn("rounded-md border-l-4 p-4", s.bg, s.border)}
    >
      <p className={cn("font-data font-semibold", s.text)}>{s.label}</p>
      {reason && <p className="mt-1 text-sm text-(--color-ink)">{reason}</p>}
      {nextStep && (
        <p className="mt-1 text-sm text-(--color-ink-soft)">{nextStep}</p>
      )}
    </div>
  );
}
