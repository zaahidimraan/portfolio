"use client";

import { useRef, useState } from "react";
import { citizens, OFFICE_WINDOWS, type Citizen } from "@/content/society";
import { toggleNight, useNight } from "@/lib/use-night";
import { FIGURES } from "./figures";

type Speed = 0.5 | 1 | 2;

/** Deterministic pseudo-random so server and client markup match exactly. */
function seeded(i: number): number {
  return ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
}

/**
 * A small society along the bottom of the page: people commuting, building,
 * working, resting, and a plane overhead. The visitor can pause the whole
 * thing, change its speed, flip between day and night, and click any citizen
 * to freeze them and read what they're doing.
 *
 * Everything is CSS animation over inline SVG — pausing is `animation-play-state`
 * driven by one custom property, so stopping the world costs nothing and
 * resumes exactly where it left off.
 */
export function CityScene() {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<Speed>(1);
  const night = useNight();
  const [selected, setSelected] = useState<Citizen | null>(null);
  const [frozen, setFrozen] = useState<Set<string>>(new Set());
  const sceneRef = useRef<HTMLDivElement>(null);

  const isNight = night ?? false;

  function toggleCitizen(citizen: Citizen) {
    setSelected((current) => (current?.id === citizen.id ? null : citizen));
    setFrozen((current) => {
      const next = new Set(current);
      if (next.has(citizen.id)) next.delete(citizen.id);
      else next.add(citizen.id);
      return next;
    });
  }

  const visible = citizens.filter((c) => (isNight ? !c.dayOnly : !c.nocturnal));

  return (
    <section
      className="society no-print"
      aria-label="An animated illustration of a small town, for decoration"
      data-night={isNight ? "true" : "false"}
      data-playing={playing ? "true" : "false"}
      style={{ ["--soc-speed" as string]: String(speed) }}
      ref={sceneRef}
    >
      <div className="society-head">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
          {isNight ? "The town after dark" : "The town, mid-shift"}
        </h2>
        <div className="society-controls">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-pressed={!playing}
            className="soc-btn"
          >
            {playing ? "❙❙ Pause" : "▶ Play"}
          </button>
          {([0.5, 1, 2] as Speed[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              aria-pressed={speed === s}
              className={`soc-btn ${speed === s ? "soc-btn-on" : ""}`}
            >
              {s}×
            </button>
          ))}
          <button
            type="button"
            onClick={() => toggleNight()}
            className="soc-btn"
          >
            {isNight ? "☀ Daytime" : "☾ Nightfall"}
          </button>
        </div>
      </div>

      <div className="society-stage">
        {/* ---- backdrop: skyline ---- */}
        <div className="soc-skyline" aria-hidden>
          <svg viewBox="0 0 1200 150" preserveAspectRatio="none" className="soc-skyline-svg">
            {/* offices */}
            <rect x="60" y="30" width="90" height="120" className="soc-building" />
            <rect x="170" y="60" width="60" height="90" className="soc-building" />
            <rect x="700" y="20" width="110" height="130" className="soc-building" />
            <rect x="830" y="55" width="70" height="95" className="soc-building" />
            {/* homes with pitched roofs */}
            <path d="M280 150 V95 L320 68 L360 95 V150 Z" className="soc-building" />
            <path d="M380 150 V105 L412 82 L444 105 V150 Z" className="soc-building" />
            <path d="M950 150 V100 L985 74 L1020 100 V150 Z" className="soc-building" />
            <path d="M1040 150 V110 L1070 88 L1100 110 V150 Z" className="soc-building" />
            {/* the tower under construction, with a crane */}
            <rect x="490" y="45" width="80" height="105" className="soc-building" />
            <line x1="600" y1="150" x2="600" y2="18" className="soc-crane" />
            <line x1="600" y1="22" x2="672" y2="22" className="soc-crane" />
            <line x1="655" y1="22" x2="655" y2="48" className="soc-crane-cable" />
            <rect x="648" y="48" width="15" height="11" className="soc-crane-load" />
            {/* windows — deterministic, some lit after dark */}
            {Array.from({ length: OFFICE_WINDOWS }, (_, i) => {
              const col = i % 6;
              const row = Math.floor(i / 6);
              const lit = seeded(i) > 0.42;
              return (
                <rect
                  key={i}
                  x={72 + col * 13}
                  y={44 + row * 22}
                  width="8"
                  height="12"
                  className={`soc-window ${lit ? "soc-window-lit" : ""}`}
                  style={{ animationDelay: `${(seeded(i + 40) * 8).toFixed(2)}s` }}
                />
              );
            })}
            {Array.from({ length: 12 }, (_, i) => {
              const col = i % 4;
              const row = Math.floor(i / 4);
              const lit = seeded(i + 90) > 0.5;
              return (
                <rect
                  key={`t-${i}`}
                  x={716 + col * 23}
                  y={36 + row * 26}
                  width="10"
                  height="14"
                  className={`soc-window ${lit ? "soc-window-lit" : ""}`}
                  style={{ animationDelay: `${(seeded(i + 12) * 9).toFixed(2)}s` }}
                />
              );
            })}
          </svg>
          {/* sun / moon */}
          <div className="soc-celestial" />
        </div>

        {/* ---- the citizens ---- */}
        {visible.map((citizen) => {
          const Figure = FIGURES[citizen.behaviour];
          const mobile = citizen.behaviour === "walk" || citizen.behaviour === "cycle" || citizen.behaviour === "fly" || citizen.behaviour === "dog";
          return (
            <button
              key={citizen.id}
              type="button"
              onClick={() => toggleCitizen(citizen)}
              className={`soc-citizen soc-${citizen.behaviour} soc-lane-${citizen.lane} ${
                frozen.has(citizen.id) ? "soc-frozen" : ""
              } ${selected?.id === citizen.id ? "soc-selected" : ""}`}
              style={{
                left: `${citizen.x}%`,
                ["--soc-dur" as string]: `${citizen.duration}s`,
                ["--soc-delay" as string]: `${citizen.offset}s`,
              }}
              aria-label={`${citizen.role}: ${isNight ? citizen.nightTask : citizen.dayTask}. Click to freeze.`}
              data-mobile={mobile ? "true" : "false"}
            >
              <span className="soc-figure">
                <Figure />
              </span>
            </button>
          );
        })}

        {/* ---- ground ---- */}
        <div className="soc-road" aria-hidden>
          <span className="soc-road-dashes" />
        </div>
      </div>

      <p className="society-caption font-mono" aria-live="polite">
        {selected ? (
          <>
            <strong className="text-foreground">{selected.role}</strong> —{" "}
            {isNight ? selected.nightTask : selected.dayTask}{" "}
            <span className="opacity-60">(click again to release)</span>
          </>
        ) : (
          <>Click anyone to stop them and see what they&apos;re doing.</>
        )}
      </p>
    </section>
  );
}
