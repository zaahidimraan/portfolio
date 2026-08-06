"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The companion (CAST-2).
 *
 * One character for the whole site. It does nothing on its own — it goes where
 * the visitor looks. That is the entire design rule, and the reason the old
 * ambient town was deleted: motion nobody caused reads as noise.
 *
 * Opting an element in costs one attribute, `data-perch`:
 *   jump — leap in an arc and land on it (buttons)
 *   walk — light a street and walk along it (impact numbers)
 *   hop  — short skip between neighbours (experience roles)
 *
 * A single delegated listener on the document drives all of it, so sections
 * stay free of animation plumbing and a new perch is one attribute, not a
 * component rewrite.
 */

type Mode = "jump" | "walk" | "hop";

type Spot = {
  /** Where the character's feet land, in viewport coordinates. */
  x: number;
  y: number;
  mode: Mode;
  /** The street to light, for walk mode. */
  street: { left: number; top: number; width: number } | null;
};

const PERCH = "[data-perch]";
/** Where the character waits: the hero's Download CV button when it is on
 *  screen, otherwise the sticky nav CV chip, which always is. */
const HOME_PRIMARY = '[data-perch-home="primary"]';
const HOME_ANY = "[data-perch-home]";

/** Half the figure's width and its full height, in px — see .cast-figure. */
const HALF_W = 13;
const HEIGHT = 40;

function readSpot(el: HTMLElement): Spot {
  const r = el.getBoundingClientRect();
  const mode = (el.dataset.perch as Mode) || "jump";
  return {
    x: r.left + r.width / 2,
    // Feet on the element's top edge — unless it sits so high in the viewport
    // that the figure would be cut off by it (the sticky nav chip does), in
    // which case drop just far enough to keep the whole character visible.
    y: Math.max(r.top, HEIGHT + 4),
    mode,
    street: mode === "walk" ? { left: r.left, top: r.top, width: r.width } : null,
  };
}

/** Visible enough to stand on. */
function inView(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  return r.bottom > 8 && r.top < window.innerHeight - 8;
}

/**
 * Where the character waits when the visitor is pointing at nothing.
 *
 * The hero's Download CV button is the home it belongs on, but that scrolls
 * away — and a companion that vanishes for most of the page is no companion.
 * The sticky nav CV chip is the fallback, so it always has somewhere to stand
 * and is always one glance away.
 */
function restingPlace(): HTMLElement | null {
  const primary = document.querySelector<HTMLElement>(HOME_PRIMARY);
  if (primary && inView(primary)) return primary;
  for (const el of document.querySelectorAll<HTMLElement>(HOME_ANY)) {
    if (inView(el)) return el;
  }
  return null;
}

export function Stage() {
  const [spot, setSpot] = useState<Spot | null>(null);
  const [facing, setFacing] = useState(1);
  const [moveId, setMoveId] = useState(0);
  const [duration, setDuration] = useState(420);

  /** Element currently under the pointer, and one pinned by a click. */
  const hovered = useRef<HTMLElement | null>(null);
  const pinned = useRef<HTMLElement | null>(null);
  const lastX = useRef<number | null>(null);

  /** Recompute from whichever element is in charge right now. */
  const settle = useCallback((animate: boolean) => {
    const el = pinned.current ?? hovered.current ?? restingPlace();

    if (!el || !inView(el)) {
      setSpot(null);
      lastX.current = null;
      return;
    }

    const next = readSpot(el);
    setSpot(next);

    if (!animate) return;
    const from = lastX.current;
    if (from !== null && Math.abs(next.x - from) > 4) setFacing(next.x > from ? 1 : -1);
    // Longer trips take longer — a constant duration makes short hops sluggish
    // and long walks teleport.
    const distance = from === null ? 0 : Math.abs(next.x - from);
    setDuration(Math.min(Math.max(300, distance * 1.15), 900));
    lastX.current = next.x;
    setMoveId((n) => n + 1);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = (e: Event) =>
      (e.target as Element | null)?.closest?.(PERCH) as HTMLElement | null;

    const onOver = (e: PointerEvent) => {
      const el = target(e);
      if (el === hovered.current) return;
      hovered.current = el;
      settle(true);
    };

    const onFocus = (e: FocusEvent) => {
      const el = target(e);
      // Keyboard users get the same behaviour, but an unrelated focus must not
      // yank the character away from a pinned perch.
      if (!el && pinned.current) return;
      hovered.current = el;
      settle(true);
    };

    // Click pins, so touch devices (which have no hover) still get the walk.
    const onClick = (e: MouseEvent) => {
      const el = target(e);
      pinned.current = el && pinned.current !== el ? el : null;
      settle(true);
    };

    const onLeave = () => {
      hovered.current = null;
      settle(true);
    };

    // Scroll and resize move the perch under the character; follow it, but
    // without replaying the travel animation each frame.
    let frame = 0;
    const onShift = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        settle(false);
      });
    };

    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("focusin", onFocus);
    document.addEventListener("click", onClick);
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onShift, { passive: true });
    window.addEventListener("resize", onShift, { passive: true });

    settle(false);

    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onShift);
      window.removeEventListener("resize", onShift);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [settle]);

  if (!spot) return null;

  return (
    <div className="cast-stage" aria-hidden>
      {spot.street && (
        <span
          className="cast-street"
          key={`street-${moveId}`}
          style={{
            left: `${spot.street.left}px`,
            top: `${spot.street.top}px`,
            width: `${spot.street.width}px`,
            transformOrigin: facing > 0 ? "left center" : "right center",
          }}
        />
      )}
      <div
        className="cast-actor"
        data-mode={spot.mode}
        style={{
          transform: `translate3d(${spot.x - HALF_W}px, ${spot.y - HEIGHT}px, 0)`,
          transitionDuration: `${duration}ms`,
        }}
      >
        {/* Remounted on every move so the leap replays from the top. */}
        <div className="cast-arc" key={moveId} style={{ animationDuration: `${duration}ms` }}>
          <div className="cast-flip" style={{ transform: `scaleX(${facing})` }}>
            <Figure />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 26 × 40 line figure with a trailing scarf, matching the site's stroke style. */
function Figure() {
  const line = {
    stroke: "currentColor",
    fill: "none",
    strokeLinecap: "round" as const,
  };
  return (
    <svg viewBox="0 0 26 40" className="cast-figure" focusable="false">
      {/* scarf — trails behind whichever way it is facing */}
      <path className="cast-scarf" d="M11 12 q-7 2 -9 7" strokeWidth="1.8" {...line} />
      <circle cx="13" cy="7" r="4.4" fill="currentColor" />
      <line x1="13" y1="11.4" x2="13" y2="25" strokeWidth="2.6" {...line} />
      <g className="cast-limb cast-arm-a">
        <line x1="13" y1="15" x2="13" y2="22" strokeWidth="2" {...line} />
      </g>
      <g className="cast-limb cast-arm-b">
        <line x1="13" y1="15" x2="13" y2="22" strokeWidth="2" {...line} />
      </g>
      <g className="cast-limb cast-leg-a">
        <line x1="13" y1="25" x2="13" y2="38" strokeWidth="2.4" {...line} />
      </g>
      <g className="cast-limb cast-leg-b">
        <line x1="13" y1="25" x2="13" y2="38" strokeWidth="2.4" {...line} />
      </g>
    </svg>
  );
}
