"use client";

import { useState } from "react";

/**
 * Zahid Imran Street (E24).
 *
 * The theme layer: the site reads as an old English street that carries
 * Zahid's name. The hero gets a cast-iron-style nameplate; every section is a
 * shop whose header is a fascia signboard with a wall lamp. No characters —
 * the street's life is light.
 */

/** The classic UK street nameplate: white plate, heavy border, spaced caps. */
export function StreetSign({ className = "" }: { className?: string }) {
  return (
    // Not aria-hidden: this replaces the hero's location line, so the city has
    // to stay in the accessibility tree.
    <div className={`street-sign ${className}`.trim()}>
      <span className="street-sign-name">Zahid Imran Street</span>
      <span className="street-sign-sub">City of Manchester · est. 2020</span>
    </div>
  );
}

/**
 * The wall lamp on each shop fascia (STR-2.4).
 *
 * Hovering the fascia previews the light; clicking the lamp keeps the shop
 * lit (or puts it out). State lives on the section element as a class so the
 * glow can wash the whole header, and the button carries aria-pressed so the
 * toggle is real UI, not decoration.
 */
export function Lamp() {
  const [lit, setLit] = useState(false);

  return (
    <button
      type="button"
      className="shop-lamp"
      aria-pressed={lit}
      aria-label={lit ? "Turn this shop's lamp off" : "Turn this shop's lamp on"}
      title={lit ? "Lights off" : "Lights on"}
      onClick={(event) => {
        // The section's class is the truth; state only mirrors it for
        // aria-pressed. Deriving `next` from state instead desyncs under
        // rapid clicks, because the class flips synchronously while the
        // state commit is still pending.
        const section = event.currentTarget.closest("section");
        if (!section) return;
        const next = !section.classList.contains("lit");
        section.classList.toggle("lit", next);
        setLit(next);
      }}
    >
      <svg viewBox="0 0 34 30" className="shop-lamp-svg" aria-hidden focusable="false">
        {/* wall bracket, curling out from the fascia */}
        <path
          d="M2 4 h10 q7 0 8 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* the halo — pure glow, hidden under reduced motion */}
        <circle className="shop-glow" cx="20" cy="19" r="8.5" fill="currentColor" />
        {/* lantern: cap, glass, finial */}
        <path d="M16 12 h8 l-1.5 3 h-5 z" fill="currentColor" />
        <rect className="shop-lamp-glass" x="16.5" y="15" width="7" height="7.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <line x1="20" y1="22.5" x2="20" y2="25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}
