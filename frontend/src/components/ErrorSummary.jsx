import { useEffect, useRef } from "react";

/**
 * WCAG-compliant error summary: announced via role="alert", receives focus on
 * appearance, and links each message to its field by id so keyboard/AT users
 * can jump straight to the problem.
 */
export function ErrorSummary({ errors, title = "There is a problem" }) {
  const ref = useRef(null);
  const entries = Object.entries(errors || {}).filter(([, msg]) =>
    Boolean(msg),
  );

  useEffect(() => {
    if (entries.length > 0 && ref.current) {
      ref.current.focus();
    }
  }, [entries.length]);

  if (entries.length === 0) return null;

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="mb-6 rounded-md border-2 border-(--color-clay) bg-(--color-clay-tint) p-4"
    >
      <h2 className="font-data font-semibold text-(--color-clay-deep)">
        {title}
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-(--color-clay-deep)">
        {entries.map(([field, message]) => (
          <li key={field}>
            <a
              href={`#field-${field}`}
              className="underline underline-offset-2 hover:no-underline"
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
