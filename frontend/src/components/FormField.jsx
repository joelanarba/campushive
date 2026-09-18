import { cloneElement, useId } from "react";

/**
 * Labelled input with aria-describedby wiring to its own inline error message.
 * Pair with <ErrorSummary> at the top of the form for the full WCAG pattern.
 */
export const FormField = ({
  children,
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  hint,
  autoComplete,
  trailing,
}) => {
  const generatedId = useId();
  const fieldId = id || children?.props.id || (children?.props.name ? "field-" + children.props.name : generatedId);
  return (
    <div className="mb-4">
      <label
        htmlFor={fieldId}
        className="mb-1.5 block text-sm font-medium text-(--color-ink) dark:text-(--color-paper)"
      >
        {label}
      </label>

      <div className="relative">
        {children ? cloneElement(children, { id: fieldId, "aria-invalid": error ? "true" : undefined, "aria-describedby": error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined }) : <input
          id={fieldId}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
          }
          className={`w-full rounded-md border bg-(--color-paper) px-3 py-2 text-sm text-(--color-ink) placeholder:text-(--color-ink-soft) dark:bg-(--color-ink-raised) dark:text-(--color-paper) dark:placeholder:text-(--color-paper)/50 ${
            error
              ? "border-(--color-clay)"
              : "border-(--color-line) dark:border-(--color-line-dark)"
          } ${trailing ? "pr-10" : ""}`}
        />}
        {trailing && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {trailing}
          </div>
        )}
      </div>

      {error ? (
        <p id={`${fieldId}-error`} className="mt-1 text-xs text-(--color-clay)">
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${fieldId}-hint`}
          className="mt-1 text-xs text-(--color-ink-soft) dark:text-(--color-paper)/60"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
};
