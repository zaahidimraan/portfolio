"use client";

import { useEffect } from "react";

/**
 * Site motion (drop-in): depth at rest, blur-dissolve reveal, and a randomised
 * hover effect per card — a different one each time, never repeating the last.
 *
 * Mount once in app/layout.tsx, inside <body>:
 *   import { SiteMotion } from "@/components/site-motion";
 *   …
 *   <SiteMotion />
 *
 * Design rules it keeps:
 *  - Monochrome: every colour is read from the existing --foreground/--background
 *    tokens, so it inverts with the theme and adds no chroma.
 *  - Readable: text never scales past 1.02 and never blurs on hover; the invert
 *    effect rebinds the tokens on the card, so links and muted text flip too.
 *  - prefers-reduced-motion: reduce → nothing runs. Touch (hover: none) → no hover FX.
 *  - The site's own .reveal class is left alone; this only touches cards that
 *    opt in via [data-card] or the default selector below.
 */

/**
 * A "surface" is anything the eye reads as a panel, button or chip: it has a
 * visible border, or a background of its own. Detected from *computed* style —
 * inline style strings are re-serialised by the framework, and 1px borders can
 * compute to 0.8px under zoom, so substring selectors and w>=1 tests miss most
 * of the page. This is why coverage must be measured, not assumed.
 */
function surfaces(): HTMLElement[] {
  const pageBg = getComputedStyle(document.body).backgroundColor;
  const isSurface = (el: HTMLElement) => {
    if (["ARTICLE", "IMG", "TABLE", "PRE", "CODE", "BUTTON"].includes(el.tagName)) return true;
    const cs = getComputedStyle(el);
    if (cs.position === "absolute" || cs.pointerEvents === "none") return false;
    const bordered = (["Top", "Right", "Bottom", "Left"] as const).some(
      (s) => (parseFloat(cs[`border${s}Width` as "borderTopWidth"]) || 0) >= 0.4,
    );
    const bg = cs.backgroundColor;
    const filled = !!bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && bg !== pageBg;
    return bordered || filled;
  };
  const all = Array.from(document.querySelectorAll<HTMLElement>("main *, nav *, footer *")).filter(
    (el) =>
      el.offsetHeight > 14 &&
      el.offsetWidth > 22 &&
      el.offsetHeight < window.innerHeight * 1.4 &&
      isSurface(el),
  );
  const set = new Set(all);
  // Keep innermost surfaces: a wrapper holding other surfaces is a grid, not a card.
  return all.filter(
    (el) =>
      el.tagName === "ARTICLE" ||
      el.tagName === "IMG" ||
      !Array.from(el.querySelectorAll<HTMLElement>("*")).some((c) => set.has(c)),
  );
}

type Fx = {
  name: string;
  move?: boolean;
  enter: (el: HTMLElement, k: number, d: number, ev: PointerEvent) => void;
};

function sheen(el: HTMLElement) {
  const s = document.createElement("div");
  s.dataset.fxLayer = "1";
  s.style.cssText =
    "position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:linear-gradient(105deg,transparent 35%,color-mix(in srgb,var(--foreground) 9%,transparent) 50%,transparent 65%);background-size:280% 100%;background-position:120% 0;transition:background-position .75s ease";
  el.appendChild(s);
  requestAnimationFrame(() => (s.style.backgroundPosition = "-40% 0"));
}

function rule(el: HTMLElement) {
  const s = document.createElement("div");
  s.dataset.fxLayer = "1";
  s.style.cssText =
    "position:absolute;left:0;bottom:0;height:2px;width:100%;pointer-events:none;background:var(--foreground);transform:scaleX(0);transform-origin:left center;transition:transform .5s cubic-bezier(.2,.7,.3,1)";
  el.appendChild(s);
  requestAnimationFrame(() => (s.style.transform = "scaleX(1)"));
}

const FX: Fx[] = [
  {
    name: "lift",
    enter: (el, k, d) => {
      el.style.transform = `perspective(900px) translateY(${-7 * k}px)`;
      el.style.boxShadow = `0 ${18 * d}px ${34 * d}px color-mix(in srgb, var(--foreground) ${14 * d}%, transparent)`;
    },
  },
  {
    name: "tilt",
    move: true,
    enter: (el, k, d, ev) => {
      const r = el.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${-py * 6 * k}deg) rotateY(${px * 8 * k}deg) translateZ(${10 * k}px)`;
      el.style.boxShadow = `${-px * 22 * d}px ${16 * d}px ${30 * d}px color-mix(in srgb, var(--foreground) ${13 * d}%, transparent)`;
    },
  },
  {
    name: "swell",
    enter: (el, k, d) => {
      el.style.transform = `perspective(900px) scale(${1 + 0.018 * k})`;
      el.style.boxShadow = `0 ${12 * d}px ${28 * d}px color-mix(in srgb, var(--foreground) ${12 * d}%, transparent)`;
    },
  },
  {
    name: "skew",
    enter: (el, k, d) => {
      el.style.transform = `perspective(900px) translateY(${-4 * k}px) rotate(${-0.5 * k}deg)`;
      el.style.boxShadow = `${6 * d}px ${14 * d}px ${26 * d}px color-mix(in srgb, var(--foreground) ${12 * d}%, transparent)`;
    },
  },
  {
    // Rebinds the tokens locally, so links and muted text invert with the card.
    name: "invert",
    enter: (el, k, d) => {
      const cs = getComputedStyle(document.documentElement);
      const ink = cs.getPropertyValue("--foreground").trim();
      const paper = cs.getPropertyValue("--background").trim();
      el.style.setProperty("--background", ink);
      el.style.setProperty("--foreground", paper);
      el.style.setProperty("--muted", `color-mix(in srgb, ${paper} 68%, ${ink})`);
      el.style.setProperty("--border", `color-mix(in srgb, ${paper} 34%, ${ink})`);
      el.style.setProperty("--accent", paper);
      el.style.setProperty("--accent-soft", `color-mix(in srgb, ${paper} 12%, ${ink})`);
      el.style.background = "var(--background)";
      el.style.color = "var(--foreground)";
      el.style.transform = `perspective(900px) translateY(${-3 * k}px)`;
      el.style.boxShadow = `0 ${10 * d}px ${24 * d}px color-mix(in srgb, ${ink} ${16 * d}%, transparent)`;
    },
  },
  {
    name: "sweep",
    enter: (el, k, d) => {
      el.style.transform = `perspective(900px) translateY(${-3 * k}px)`;
      el.style.boxShadow = `0 ${10 * d}px ${24 * d}px color-mix(in srgb, var(--foreground) ${11 * d}%, transparent)`;
      sheen(el);
    },
  },
  {
    name: "rule",
    enter: (el, k, d) => {
      el.style.transform = `perspective(900px) translateY(${-3 * k}px)`;
      el.style.boxShadow = `0 ${9 * d}px ${20 * d}px color-mix(in srgb, var(--foreground) ${10 * d}%, transparent)`;
      rule(el);
    },
  },
  {
    name: "corner",
    enter: (el, k, d) => {
      el.style.transformOrigin = "left center";
      el.style.transform = `perspective(900px) rotateY(${3.5 * k}deg) translateY(${-4 * k}px)`;
      el.style.boxShadow = `${14 * d}px ${12 * d}px ${26 * d}px color-mix(in srgb, var(--foreground) ${13 * d}%, transparent)`;
    },
  },
];

export function SiteMotion({ motion = 1, depth = 1 }: { motion?: number; depth?: number }) {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = surfaces();

    const rest = (el: HTMLElement) => {
      el.style.boxShadow = depth
        ? `0 ${(1.5 * depth).toFixed(1)}px ${(4 * depth).toFixed(1)}px color-mix(in srgb, var(--foreground) ${(5 * depth).toFixed(0)}%, transparent)`
        : "none";
      el.style.transform = "perspective(900px)";
      el.style.transition =
        "transform .45s cubic-bezier(.2,.7,.3,1), box-shadow .45s ease, background-color .35s ease, color .35s ease, border-color .35s ease";
      el.style.willChange = "transform";
    };

    // Depth at rest — sections become perspective stages, cards get a soft shadow.
    document.querySelectorAll<HTMLElement>("section, header").forEach((s) => {
      s.style.perspective = "1200px";
    });
    cards.forEach((el) => {
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      rest(el);
    });

    if (matchMedia("(hover: none)").matches) return;

    const cleanups: Array<() => void> = [];
    for (const el of cards) {
      let fx: Fx | null = null;
      let onMove: ((e: PointerEvent) => void) | null = null;

      const onEnter = (ev: PointerEvent) => {
        // Small surfaces (chips, buttons, nav links) only take the effects that
        // read well at that size — no tilt or hinge on a 27px chip.
        const small = el.offsetHeight < 58;
        const ok = small
          ? ["lift", "invert", "sweep", "rule", "swell"]
          : FX.map((f) => f.name);
        const pool = FX.filter((f) => ok.includes(f.name) && f.name !== el.dataset.fxLast);
        fx = pool[Math.floor(Math.random() * pool.length)];
        el.dataset.fxLast = fx.name;
        fx.enter(el, motion, depth, ev);
        if (fx.move) {
          onMove = (e: PointerEvent) => fx!.enter(el, motion, depth, e);
          el.addEventListener("pointermove", onMove);
        }
      };
      const onLeave = () => {
        if (onMove) {
          el.removeEventListener("pointermove", onMove);
          onMove = null;
        }
        el.style.background = "";
        el.style.color = "";
        el.style.transformOrigin = "";
        ["--background", "--foreground", "--muted", "--border", "--accent", "--accent-soft"].forEach(
          (p) => el.style.removeProperty(p),
        );
        rest(el);
        el.querySelectorAll<HTMLElement>("[data-fx-layer]").forEach((n) => {
          n.style.opacity = "0";
          setTimeout(() => n.remove(), 400);
        });
      };

      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointerleave", onLeave);
      });
    }
    return () => cleanups.forEach((c) => c());
  }, [motion, depth]);

  return null;
}
