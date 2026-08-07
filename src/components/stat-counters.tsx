"use client";

import { useEffect, useRef } from "react";
import { stats, type Stat } from "@/content/profile";

function formatValue(stat: Stat, value: number): string {
  const decimals = stat.decimals ?? 0;
  return value.toLocaleString("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function label(stat: Stat, value: number): string {
  return `${stat.prefix ?? ""}${formatValue(stat, value)}${stat.suffix ?? ""}`;
}

const DURATION_MS = 1100;
const STAGGER_MS = 90;

/**
 * "Impact in numbers" — every value mirrors a CV bullet (see profile.ts).
 *
 * The markup carries the final values, so server-rendered HTML, no-JS
 * visitors and reduced-motion visitors all get the real numbers with nothing
 * to wait for. The count-up then drives `textContent` directly through refs
 * rather than React state: sixty renders a second of the whole grid to
 * animate six numbers is work nobody sees, and holding the frame value in
 * state also meant re-rendering from an effect on mount.
 */
export function StatCounters() {
  const gridRef = useRef<HTMLDivElement>(null);
  const valueRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const total = DURATION_MS + STAGGER_MS * stats.length;

    /** Paint every tile at a point `t` (0→1) through the shared clock. */
    const paint = (t: number) => {
      stats.forEach((stat, i) => {
        const node = valueRefs.current[i];
        if (!node) return;
        // per-tile stagger inside the shared clock, eased out for a settle feel
        const local = Math.min(Math.max((t * total - i * STAGGER_MS) / DURATION_MS, 0), 1);
        const eased = 1 - Math.pow(1 - local, 3);
        node.textContent = label(stat, stat.value * eased);
      });
    };

    paint(0);

    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / total, 1);
          paint(t);
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
      // Never leave a half-counted number behind on unmount.
      paint(1);
    };
  }, []);

  return (
    <div ref={gridRef} className="stagger grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-3">
      {stats.map((stat, i) => (
        <a
          key={stat.label}
          href={stat.href}
          className="group block border-t border-border pt-4 transition-colors hover:border-foreground"
        >
          <div
            ref={(node) => {
              valueRefs.current[i] = node;
            }}
            className="tnum text-4xl font-bold tracking-tight sm:text-5xl"
          >
            {label(stat, stat.value)}
          </div>
          <p className="mt-2 text-sm leading-snug text-foreground/85">{stat.label}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
            {stat.source}
            <span className="ml-1 opacity-0 transition-opacity group-hover:opacity-100">
              → source
            </span>
          </p>
        </a>
      ))}
    </div>
  );
}
