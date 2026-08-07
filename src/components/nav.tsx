import { identity } from "@/content/profile";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { ScrollProgress } from "./scroll-progress";
import { ThemeToggle } from "./theme-toggle";

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
        <a href="#top" className="mark-link flex items-center gap-2.5 font-mono text-sm font-semibold">
          <Logo />
          <span>
            zahid<span className="text-muted">.</span>imran
          </span>
        </a>
        <div className="flex items-center gap-1 sm:gap-4">
          <NavLinks />
          <a
            href={identity.cvPath}
            download
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-85"
          >
            CV
          </a>
          <ThemeToggle />
        </div>
      </nav>
      <ScrollProgress />
    </header>
  );
}
