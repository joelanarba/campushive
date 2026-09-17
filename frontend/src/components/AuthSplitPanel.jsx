import Logo from "./Logo";

/**
 * Left-hand branding panel used on auth pages (login/register).
 * Hidden below the lg breakpoint so mobile just gets the form.
 */
export function AuthSplitPanel({ headline, points }) {
  return (
    <div className="honeycomb-bg hidden lg:flex lg:flex-col lg:justify-between border-r border-(--color-line) dark:border-(--color-line-dark) px-10 py-12">
      <Logo />

      <div className="max-w-sm">
        <p className="font-display text-3xl font-semibold leading-tight text-(--color-ink) dark:text-(--color-paper)">
          {headline}
        </p>

        {points && (
          <ul className="mt-6 space-y-3">
            {points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 text-sm text-(--color-ink) dark:text-(--color-paper)">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-(--color-moss) text-xs text-white">
                  ✓
                </span>
                {point}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-(--color-ink-soft) dark:text-(--color-paper)/60">
        Built by students, for students.
      </p>
    </div>
  );
}
