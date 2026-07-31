import { identity } from "@/content/profile";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "#projects", label: "Projects" },
  { href: "#experience", label: "Experience" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
        <a href="#top" className="font-mono text-sm font-semibold">
          zahid<span className="text-accent">.</span>imran
        </a>
        <div className="flex items-center gap-1 sm:gap-4">
          <div className="hidden items-center gap-4 sm:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </div>
          <a
            href={identity.cvPath}
            download
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            CV
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
