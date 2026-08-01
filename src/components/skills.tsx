"use client";

import { useEffect, useState } from "react";
import { certificates, skillGroups, skillLinks } from "@/content/profile";
import { slugify } from "@/lib/slug";

/**
 * DTL-2: chips with CV evidence become toggles — selecting one highlights
 * the flagship cards / roles that prove the skill and dims the rest.
 * Chips without a mapping stay plain (no fake proficiency, no fake links).
 */
export function Skills() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const entities = document.querySelectorAll<HTMLElement>(
      '[id^="proj-"], [id^="exp-"], [id^="edu-"]',
    );
    const targets = active ? new Set(skillLinks[active]) : null;
    entities.forEach((el) => {
      el.classList.toggle("matrix-lit", targets?.has(el.id) ?? false);
      el.classList.toggle("matrix-dim", targets !== null && !targets.has(el.id));
    });
    return () => entities.forEach((el) => el.classList.remove("matrix-lit", "matrix-dim"));
  }, [active]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {skillGroups.map((g) => (
          <div key={g.label} className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted">{g.label}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {g.items.map((item) => {
                const links = skillLinks[item];
                if (!links) {
                  return (
                    <span
                      key={item}
                      id={`skill-${slugify(item)}`}
                      className="rounded bg-accent-soft px-2 py-0.5 font-mono text-xs text-foreground/90"
                    >
                      {item}
                    </span>
                  );
                }
                const isActive = active === item;
                return (
                  <button
                    key={item}
                    id={`skill-${slugify(item)}`}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActive((cur) => (cur === item ? null : item))}
                    className={`cursor-pointer rounded px-2 py-0.5 font-mono text-xs transition-colors ${
                      isActive
                        ? "bg-accent text-background"
                        : "bg-accent-soft text-foreground/90 hover:bg-accent hover:text-background"
                    }`}
                  >
                    {item}
                    <span className={isActive ? "opacity-80" : "opacity-50"}>
                      {" "}
                      ·{links.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted" aria-live="polite">
        {active
          ? `Highlighting what proves “${active}” — click again to clear`
          : "Chips with a count are clickable — they highlight the work that proves the skill"}
      </p>
    </div>
  );
}

export function Certificates() {
  return (
    <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {certificates.map((c) => (
        <li key={c.name} className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-foreground/85">{c.name}</span>
          <span className="shrink-0 font-mono text-xs text-muted">
            {c.issuer} · {c.date}
          </span>
        </li>
      ))}
    </ul>
  );
}
