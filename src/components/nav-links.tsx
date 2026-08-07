"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "/#impact", label: "Impact" },
  { href: "/#office", label: "Office" },
  { href: "/#projects", label: "Projects" },
  { href: "/#experience", label: "Experience" },
  { href: "/#mcp", label: "Ask AI" },
  { href: "/services", label: "Hire me", emphasis: true },
];

/** Desktop section links; the section currently in view is highlighted. */
export function NavLinks() {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    // Only the in-page anchors have sections to observe; /services is a page.
    const sections = LINKS.filter((l) => l.href.includes("#"))
      .map((l) => document.getElementById(l.href.split("#")[1]))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`/#${entry.target.id}`);
        }
      },
      // a band around the upper-middle of the viewport decides the active section
      { rootMargin: "-35% 0px -55% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="hidden items-center gap-4 sm:flex">
      {LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          aria-current={active === link.href ? "true" : undefined}
          className={
            link.emphasis
              ? "glow-hover-sm rounded-md border border-foreground px-2.5 py-1 text-sm font-medium transition-colors hover:bg-accent hover:text-background"
              : `u-link text-sm transition-colors ${
                  active === link.href
                    ? "font-medium text-foreground"
                    : "text-muted hover:text-foreground"
                }`
          }
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
