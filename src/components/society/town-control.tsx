"use client";

import { useState } from "react";
import { useTown, type Speed } from "./town-context";

/**
 * The town's transport, floating bottom-right (TWN-4).
 *
 * It governs every district on the page, so it lives outside any one of them.
 * Collapsed to a single button by default so it never competes with the
 * content; opens on click or keyboard focus.
 */
export function TownControl() {
  const { playing, speed, night, setPlaying, setSpeed, flipClock } = useTown();
  const [open, setOpen] = useState(false);

  return (
    <div
      className="town-control no-print"
      data-open={open ? "true" : "false"}
      role="group"
      aria-label="Town animation controls"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Hide town controls" : "Show town controls"}
        className="soc-btn"
      >
        {night ? "☾" : "☀"} Town
      </button>

      <div className="town-control-items">
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          aria-pressed={!playing}
          className="soc-btn"
        >
          {playing ? "❙❙" : "▶"}
        </button>
        {([0.5, 1, 2] as Speed[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            aria-pressed={speed === s}
            aria-label={`Speed ${s} times`}
            className={`soc-btn ${speed === s ? "soc-btn-on" : ""}`}
          >
            {s}×
          </button>
        ))}
        <button type="button" onClick={flipClock} className="soc-btn">
          {night ? "Day" : "Night"}
        </button>
      </div>
    </div>
  );
}
