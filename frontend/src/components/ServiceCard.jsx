import { Link } from "react-router-dom";

/**
 * `description` and `duration` are optional — omit both for the compact
 * card used on the Landing page. Pass them (services search page) to get
 * the price-aligned-right row, description line, and a duration + "View
 * provider" meta row at the bottom.
 */
export default function ServiceCard({
  category,
  name,
  provider,
  price,
  to,
  description,
  duration,
}) {
  return (
    <li className="rounded-r-lg border-l-4 border-honey bg-paper-raised p-5 dark:bg-ink-raised">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-data text-xs font-semibold text-moss-deep dark:text-moss-tint">
            {category}
          </p>
          <h3 className="mt-1 text-base font-semibold text-ink dark:text-paper">
            <Link to={to} className="text-inherit no-underline hover:underline">
              {name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-ink-soft dark:text-paper/70">
            {provider}
          </p>
        </div>
        <p className="whitespace-nowrap font-data font-semibold text-ink dark:text-paper">
          {price}
        </p>
      </div>

      {description && (
        <p className="mt-3 text-sm text-ink dark:text-paper/90">
          {description}
        </p>
      )}

      {duration && (
        <div className="mt-3.5 flex items-center justify-between">
          <span className="text-[0.78rem] text-ink-soft dark:text-paper/60">
            {duration}
          </span>
          <Link
            to={to}
            className="font-data text-sm font-semibold text-honey-deep no-underline hover:underline"
          >
            View service
          </Link>
        </div>
      )}
    </li>
  );
}
