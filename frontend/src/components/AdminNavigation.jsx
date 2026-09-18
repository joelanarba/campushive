import { NavLink } from "react-router-dom";

export const AdminNavigation = () => (
  <nav
    aria-label="Admin dashboard"
    className="mb-6 flex flex-wrap gap-2 border-b border-line pb-4 dark:border-line-dark">
    {[
      ["/dashboard/admin", "Entrepreneur verification"],
      ["/dashboard/admin/categories", "Categories"],
    ].map(([to, label]) => (
      <NavLink
        key={to}
        to={to}
        end
        className={({ isActive }) =>
          "rounded-lg px-4 py-2 text-sm font-medium no-underline " +
          (isActive
            ? "bg-honey-tint text-ink dark:bg-honey/20 dark:text-honey"
            : "text-ink-soft hover:bg-paper-raised dark:text-paper/70 dark:hover:bg-ink-raised")
        }>
        {label}
      </NavLink>
    ))}
  </nav>
);
