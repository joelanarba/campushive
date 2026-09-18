import { Link } from "react-router-dom";
import { cn } from "../lib/cn";

const VARIANTS = {
  primary: "bg-honey text-ink hover:bg-honey-deep hover:text-white",
  danger: "bg-clay text-white hover:bg-clay-deep",
  secondary:
    "border-ink bg-transparent text-ink hover:bg-ink hover:text-paper dark:border-paper dark:text-paper dark:hover:bg-paper dark:hover:text-ink",
  ghost:
    "bg-transparent text-ink hover:bg-paper-raised dark:text-paper dark:hover:bg-ink-raised",
};

/**
 * Renders a <Link> when `to` is given, a plain <a> when `href` is given,
 * otherwise a <button>. Use the `onClick`/`type` props as normal for the
 * button case.
 */
const Button = ({
  to,
  href,
  variant = "primary",
  className = "",
  children,
  ...props
}) => {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-[1.1rem] py-[0.65rem] font-data text-sm font-semibold no-underline transition-colors duration-150 cursor-pointer",
    VARIANTS[variant],
    className,
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
