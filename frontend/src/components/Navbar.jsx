import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Button from "./Button";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import { useApp } from "../context/AppContext";

export default function Navbar() {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-line bg-paper dark:border-line-dark dark:bg-ink relative z-50">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-wrap items-center justify-between px-6 py-4"
      >
        <Logo />
        
        {/* Desktop Nav */}
        <ul className="hidden list-none gap-7 md:flex items-center">
          <li>
            <Link
              to="/services"
              className="font-data text-sm font-medium text-ink no-underline hover:text-honey-deep dark:text-paper"
            >
              Find services
            </Link>
          </li>
        </ul>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {currentUser ? (
            <>
              <Button to="/dashboard" variant="ghost">
                Dashboard
              </Button>
              <Button onClick={handleLogout} variant="secondary">
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost">
                Log in
              </Button>
              <Button to="/register" variant="primary">
                Register
              </Button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-ink dark:text-paper p-2 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-paper dark:bg-ink border-b border-line dark:border-line-dark shadow-lg md:hidden">
          <div className="flex flex-col p-6 gap-4">
            <Link
              to="/services"
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-data text-base font-medium text-ink no-underline hover:text-honey-deep dark:text-paper py-2 border-b border-line dark:border-line-dark"
            >
              Find services
            </Link>
            
            <div className="flex flex-col gap-3 mt-2">
              {currentUser ? (
                <>
                  <Button to="/dashboard" variant="ghost" className="w-full justify-center" onClick={() => setIsMobileMenuOpen(false)}>
                    Dashboard
                  </Button>
                  <Button onClick={handleLogout} variant="secondary" className="w-full justify-center">
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button to="/login" variant="ghost" className="w-full justify-center" onClick={() => setIsMobileMenuOpen(false)}>
                    Log in
                  </Button>
                  <Button to="/register" variant="primary" className="w-full justify-center" onClick={() => setIsMobileMenuOpen(false)}>
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
