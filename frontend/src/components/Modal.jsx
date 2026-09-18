import { useId, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  pending = false,
  focusKey,
  returnFocusRef,
}) => {
  const titleId = useId();
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const controls = useRef({ onClose, pending });
  useLayoutEffect(() => {
    controls.current = { onClose, pending };
  });

  useLayoutEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusDialog = () => titleRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (!controls.current.pending) controls.current.onClose();
      }
      if (event.key !== "Tab") return;
      const elements = [
        ...dialogRef.current.querySelectorAll(
          "button, a[href], input, select, textarea, [tabindex]",
        ),
      ].filter(
        (element) =>
          element.tabIndex >= 0 &&
          !element.matches(":disabled") &&
          element.getClientRects().length,
      );
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) {
        event.preventDefault();
        focusDialog();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !elements.includes(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !elements.includes(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    const onFocus = (event) => {
      if (!dialogRef.current?.contains(event.target)) focusDialog();
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocus);
      const target =
        previousFocus?.isConnected && !previousFocus.disabled
          ? previousFocus
          : returnFocusRef?.current;
      target?.focus();
    };
  }, [open, returnFocusRef]);

  useLayoutEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open, focusKey]);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={pending}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-paper p-6 text-ink shadow-xl dark:border-line-dark dark:bg-ink-raised dark:text-paper">
        <div className="flex items-start justify-between gap-4">
          <h2
            ref={titleRef}
            tabIndex={-1}
            id={titleId}
            className="font-display text-xl font-semibold focus:outline-none">
            {title}
          </h2>
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            aria-label="Close dialog"
            className="-m-2 shrink-0 rounded-lg p-2 text-ink-soft hover:bg-paper-raised disabled:cursor-wait disabled:opacity-40 dark:text-paper/70 dark:hover:bg-paper/10">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 text-sm text-ink-soft dark:text-paper/70">
          {children}
        </div>
        {footer && (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
