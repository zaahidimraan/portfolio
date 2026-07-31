"use client";

import { useEffect, useRef, useState } from "react";
import { stats, type Stat } from "@/content/profile";

function formatValue(stat: Stat, value: number): string {
  const decimals = stat.decimals ?? 0;
  return value.toLocaleString("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const DURATION_MS = 1100;
const STAGGER_MS = 90;

/**
 * "Impact in numbers" — every value mirrors a CV bullet (see profile.ts).
 * Counts up on first view; renders final values instantly for
 * reduced-motion users and whenever JS is unavailable (SSR markup).
 */
export function StatCounters() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(1); // SSR/no-JS: final values

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setProgress(0);
    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / (DURATION_MS + STAGGER_MS * stats.length), 1);
          setProgress(t);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.25 },
    );
    observer.observe(grid);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={gridRef} className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-3">
      {stats.map((stat, i) => {
        // per-tile stagger inside the shared clock, eased out for a settle feel
        const local = Math.min(
          Math.max((progress * (DURATION_MS + STAGGER_MS * stats.length) - i * STAGGER_MS) / DURATION_MS, 0),
          1,
        );
        const eased = 1 - Math.pow(1 - local, 3);
        return (
          <div key={stat.label} className="border-t border-border pt-4">
            <div className="tnum text-4xl font-bold tracking-tight sm:text-5xl">
              {stat.prefix}
              {formatValue(stat, stat.value * eased)}
              {stat.suffix}
            </div>
            <p className="mt-2 text-sm leading-snug text-foreground/85">{stat.label}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
              {stat.source}
            </p>
          </div>
        );
      })}
    </div>
  );
}
