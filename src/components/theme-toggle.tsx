"use client";

import { useSyncExternalStore } from "react";

/**
 * Three-state theme control (E35).
 *
 * `auto` is the default and the point: the page follows the home scene's sun,
 * so the site is light while Zahid's day is light and dark while it is night.
 * Choosing light or dark *pins* it — the office loop checks for a stored
 * choice before touching the class, so a pin always wins over the sun.
 *
 * The theme itself lives on <html>, written before paint by the layout script
 * and thereafter by the office loop. That makes it external state, so this
 * subscribes rather than keeping its own copy.
 */

type Mode = "auto" | "light" | "dark";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("storage", onChange);
  window.addEventListener("themepin", onChange);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onChange);
    window.removeEventListener("themepin", onChange);
  };
}

function snapshot(): string {
  const pinned = localStorage.getItem("theme");
  const dark = document.documentElement.classList.contains("dark");
  return `${pinned ?? "auto"}|${dark}`;
}

export function ThemeToggle() {
  // null on the server, so SSR markup matches the pre-hydration DOM.
  const state = useSyncExternalStore(subscribe, snapshot, () => null);
  const mode = (state?.split("|")[0] ?? "auto") as Mode;
  const dark = state?.split("|")[1] === "true";

  const label =
    mode === "auto" ? "Theme follows the time of day — click to force light"
    : mode === "light" ? "Theme pinned light — click to force dark"
    : "Theme pinned dark — click to follow the time of day";

  function cycle() {
    const next: Mode = mode === "auto" ? "light" : mode === "light" ? "dark" : "auto";
    try {
      if (next === "auto") {
        localStorage.removeItem("theme");
      } else {
        localStorage.setItem("theme", next);
        document.documentElement.classList.toggle("dark", next === "dark");
      }
    } catch {
      /* private mode — the choice just won't persist */
    }
    // MutationObserver misses auto→ (no class change yet), so nudge listeners.
    window.dispatchEvent(new Event("themepin"));
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className="rounded-md border border-border px-2.5 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
    >
      {/* both glyphs until mounted, so SSR markup matches */}
      {state === null ? "◐" : mode === "auto" ? "◐" : dark ? "☾" : "☀"}
    </button>
  );
}
