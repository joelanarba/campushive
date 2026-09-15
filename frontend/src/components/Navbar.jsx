import { Link } from "react-router-dom";
// import Logo from "./Logo";
import Button from "./Button";
import ThemeToggle from "../context/ThemeToggle";
import Logo from "./Logo";

export default function Navbar() {
  return (
    <header className="border-b border-line bg-paper dark:border-line-dark dark:bg-ink">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-wrap items-center justify-between px-6 py-4"
      >
        <Logo />
        <ul className="hidden list-none gap-7 md:flex">
          <li>
            <Link
              to="/services"
              className="font-data text-sm font-medium text-ink no-underline hover:text-honey-deep dark:text-paper"
            >
              Find services
            </Link>
          </li>
        </ul>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button to="/login" variant="ghost">
            Log in
          </Button>
          <Button to="/register" variant="primary">
            Register
          </Button>
        </div>
      </nav>
    </header>
  );
}
