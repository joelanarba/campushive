import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-line py-10 dark:border-line-dark">
      {" "}
      <div className="mx-auto flex max-w-wrap flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
        {" "}
        <div>
          {" "}
          <Logo />{" "}
          <p className="mt-3 max-w-md text-sm text-ink-soft dark:text-paper/70">
            Built by students, for students — find and book campus entrepreneurs
            without the group-chat scavenger hunt.{" "}
          </p>{" "}
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-ink dark:text-paper">
            Follow us
          </p>

          <div className="flex gap-4">
            <a
              href="#"
              aria-label="Instagram"
              className="text-sm text-ink-soft transition hover:text-ink dark:text-paper/70 dark:hover:text-paper">
              Instagram
            </a>

            <a
              href="#"
              aria-label="LinkedIn"
              className="text-sm text-ink-soft transition hover:text-ink dark:text-paper/70 dark:hover:text-paper">
              LinkedIn
            </a>

            <a
              href="#"
              aria-label="X"
              className="text-sm text-ink-soft transition hover:text-ink dark:text-paper/70 dark:hover:text-paper">
              X
            </a>

            <a
              href="#"
              aria-label="GitHub"
              className="text-sm text-ink-soft transition hover:text-ink dark:text-paper/70 dark:hover:text-paper">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
