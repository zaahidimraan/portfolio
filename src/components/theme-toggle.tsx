"use client";

import { useSyncExternalStore } from "react";

/** The theme lives on <html>, set before paint by the inline script in the
 *  layout. That makes it external state, so subscribe to it rather than
 *  copying it into React with an effect. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.classList.contains("dark");

export function ThemeToggle() {
  // null on the server, so SSR markup matches the pre-hydration DOM.
  const dark = useSyncExternalStore(subscribe, isDark, () => null);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* private mode — theme just won't persist */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-md border border-border px-2.5 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
    >
      {/* render both glyphs until mounted so SSR markup matches */}
      {dark === null ? "◐" : dark ? "☀" : "☾"}
    </button>
  );
}
