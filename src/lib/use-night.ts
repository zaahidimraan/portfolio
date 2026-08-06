"use client";

import { useEffect, useState } from "react";

/**
 * One source of truth for whether the town is in daylight or after dark.
 *
 * The site theme *is* the town clock: the `dark` class on <html> drives both.
 * Every town component reads this hook rather than checking the DOM itself, so
 * the guide, the citizens, the chart workers and the workshop can never
 * disagree about what time it is (SOC-11).
 *
 * Returns null on the first render so server and client markup match; callers
 * should treat null as "daylight, not yet known".
 */
export function useNight(): boolean | null {
  const [night, setNight] = useState<boolean | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setNight(root.classList.contains("dark"));
    read();

    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return night;
}

/** Flip the town clock (and therefore the site theme). */
export function toggleNight() {
  const root = document.documentElement;
  const next = !root.classList.contains("dark");
  root.classList.toggle("dark", next);
  try {
    localStorage.setItem("theme", next ? "dark" : "light");
  } catch {
    /* private mode — the town still flips, it just won't be remembered */
  }
  return next;
}
