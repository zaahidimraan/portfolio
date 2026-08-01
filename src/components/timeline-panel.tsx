"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { education, experience } from "@/content/profile";
import { degreeAnchor, roleAnchor } from "@/lib/slug";

type Entry = {
  anchor: string;
  heading: string;
  subheading: string;
  dates: string;
  bullets: string[];
};

const ENTRIES: Entry[] = [
  ...experience.map((role) => ({
    anchor: roleAnchor(role.company),
    heading: role.title,
    subheading: role.company,
    dates: role.dates,
    bullets: [...role.bullets],
  })),
  ...education.map((e) => ({
    anchor: degreeAnchor(e.degree),
    heading: e.degree,
    subheading: e.school,
    dates: e.dates,
    bullets: [],
  })),
];

/**
 * DTL-1: with JS, clicking a timeline bar unfolds the full entry right here
 * instead of jumping down the page. The URL hash still updates (shareable),
 * and without JS the bars remain plain anchors (INT-1 behaviour).
 */
export function TimelinePanel() {
  const [open, setOpen] = useState<Entry | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    // Delegated: catch clicks on any timeline bar in the surrounding section.
    const section = document.getElementById("experience");
    if (!section) return;

    const onClick = (event: MouseEvent) => {
      const bar = (event.target as Element).closest("a.tl-bar");
      if (!bar) return;
      const anchor = bar.getAttribute("href")?.slice(1);
      const entry = ENTRIES.find((e) => e.anchor === anchor);
      if (!entry) return;
      event.preventDefault();
      history.replaceState(null, "", `#${entry.anchor}`);
      setOpen((cur) => (cur?.anchor === entry.anchor ? null : entry));
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Element;
      if (panelRef.current && !panelRef.current.contains(target) && !target.closest("a.tl-bar")) {
        close();
      }
    };

    section.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onDocClick);
    return () => {
      section.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onDocClick);
    };
  }, [close]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="region"
      aria-label={`${open.heading} — detail`}
      className="mt-4 rounded-lg border border-foreground/60 bg-card p-5 outline-none"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 className="font-semibold">
          {open.heading} <span className="text-muted">· {open.subheading}</span>
        </h4>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted">{open.dates}</span>
          <button
            type="button"
            onClick={close}
            aria-label="Close detail panel"
            className="rounded border border-border px-2 py-0.5 font-mono text-xs text-muted transition-colors hover:bg-accent hover:text-background"
          >
            Esc ✕
          </button>
        </div>
      </div>
      {open.bullets.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {open.bullets.map((b) => (
            <li key={b} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
              <span aria-hidden className="mt-1">
                ▸
              </span>
              {b}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Full entry in the education cards below — this degree is also on the CV.
        </p>
      )}
    </div>
  );
}
