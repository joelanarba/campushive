import { Link } from "react-router-dom";
import { cn } from "../lib/cn";

export default function Logo({ className = "" }) {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex items-center gap-2 text-[1.05rem] font-semibold text-ink no-underline dark:text-paper",
        className,
      )}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        aria-hidden="true"
        className="shrink-0"
      >
        <polygon
          points="11,1 20,6 20,16 11,21 2,16 2,6"
          fill="#e8a33d"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      CampusHive
    </Link>
  );
}
