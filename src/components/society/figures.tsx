/**
 * The figures themselves. Each is a small inline SVG using `currentColor`, so
 * every citizen inverts with the theme for free and costs no image request.
 *
 * Limb motion is CSS (see globals.css); these components only define geometry
 * and hand out the class names the animations hook onto.
 */

const STROKE = {
  stroke: "currentColor",
  strokeLinecap: "round" as const,
};

/** Head + torso, shared by every upright figure. */
function Body({ scale = 1 }: { scale?: number }) {
  return (
    <g transform={`scale(${scale})`}>
      <circle cx="12" cy="6" r="3.6" fill="currentColor" />
      <line x1="12" y1="9.6" x2="12" y2="25" strokeWidth="2.3" {...STROKE} />
    </g>
  );
}

export function WalkFigure() {
  return (
    <svg viewBox="0 0 24 42" className="soc-svg" aria-hidden focusable="false">
      <g className="soc-bob">
        <Body />
        <g className="soc-limb soc-arm-b">
          <line x1="12" y1="12" x2="12" y2="21" strokeWidth="1.9" {...STROKE} />
        </g>
        <g className="soc-limb soc-arm-f">
          <line x1="12" y1="12" x2="12" y2="21" strokeWidth="1.9" {...STROKE} />
        </g>
        <g className="soc-limb soc-leg-b">
          <line x1="12" y1="25" x2="12" y2="38" strokeWidth="2.1" {...STROKE} />
        </g>
        <g className="soc-limb soc-leg-f">
          <line x1="12" y1="25" x2="12" y2="38" strokeWidth="2.1" {...STROKE} />
        </g>
      </g>
    </svg>
  );
}

export function CycleFigure() {
  return (
    <svg viewBox="0 0 40 42" className="soc-svg" aria-hidden focusable="false">
      {/* wheels */}
      <g className="soc-wheel">
        <circle cx="9" cy="33" r="6.5" fill="none" strokeWidth="1.5" {...STROKE} />
        <line x1="9" y1="26.5" x2="9" y2="39.5" strokeWidth="1" {...STROKE} />
        <line x1="2.5" y1="33" x2="15.5" y2="33" strokeWidth="1" {...STROKE} />
      </g>
      <g className="soc-wheel">
        <circle cx="31" cy="33" r="6.5" fill="none" strokeWidth="1.5" {...STROKE} />
        <line x1="31" y1="26.5" x2="31" y2="39.5" strokeWidth="1" {...STROKE} />
        <line x1="24.5" y1="33" x2="37.5" y2="33" strokeWidth="1" {...STROKE} />
      </g>
      {/* frame */}
      <path d="M9 33 L20 33 L26 21 M20 33 L26 21 M31 33 L26 21" fill="none" strokeWidth="1.6" {...STROKE} />
      <line x1="14" y1="21" x2="20" y2="21" strokeWidth="1.6" {...STROKE} />
      {/* rider */}
      <circle cx="21" cy="10" r="3.4" fill="currentColor" />
      <line x1="21" y1="13.5" x2="24" y2="23" strokeWidth="2.2" {...STROKE} />
      <line x1="21" y1="16" x2="15" y2="21" strokeWidth="1.8" {...STROKE} />
      <g className="soc-limb soc-pedal-a">
        <line x1="24" y1="23" x2="20" y2="31" strokeWidth="2" {...STROKE} />
      </g>
      <g className="soc-limb soc-pedal-b">
        <line x1="24" y1="23" x2="20" y2="31" strokeWidth="2" {...STROKE} />
      </g>
    </svg>
  );
}

/** Seated at a bench with a laptop; the working arm taps. */
export function EngineerFigure() {
  return (
    <svg viewBox="0 0 44 42" className="soc-svg" aria-hidden focusable="false">
      {/* bench / desk */}
      <line x1="4" y1="34" x2="40" y2="34" strokeWidth="2" {...STROKE} />
      <line x1="8" y1="34" x2="8" y2="41" strokeWidth="1.6" {...STROKE} />
      <line x1="36" y1="34" x2="36" y2="41" strokeWidth="1.6" {...STROKE} />
      {/* laptop */}
      <path d="M24 34 L26 25 L36 25 L36 34 Z" fill="none" strokeWidth="1.5" {...STROKE} />
      {/* seated figure */}
      <circle cx="14" cy="11" r="3.6" fill="currentColor" />
      <line x1="14" y1="14.6" x2="14" y2="27" strokeWidth="2.3" {...STROKE} />
      <line x1="14" y1="27" x2="22" y2="27" strokeWidth="2.1" {...STROKE} />
      <line x1="22" y1="27" x2="22" y2="34" strokeWidth="2.1" {...STROKE} />
      <g className="soc-limb soc-type">
        <line x1="14" y1="17" x2="25" y2="25" strokeWidth="1.9" {...STROKE} />
      </g>
    </svg>
  );
}

/** On a ladder, swinging a hammer. */
export function BuildFigure() {
  return (
    <svg viewBox="0 0 34 46" className="soc-svg" aria-hidden focusable="false">
      {/* scaffold */}
      <line x1="4" y1="8" x2="4" y2="45" strokeWidth="1.6" {...STROKE} />
      <line x1="14" y1="8" x2="14" y2="45" strokeWidth="1.6" {...STROKE} />
      <line x1="4" y1="18" x2="14" y2="18" strokeWidth="1.2" {...STROKE} />
      <line x1="4" y1="30" x2="14" y2="30" strokeWidth="1.2" {...STROKE} />
      <line x1="4" y1="42" x2="14" y2="42" strokeWidth="1.2" {...STROKE} />
      {/* worker with hard hat */}
      <path d="M18.5 9 a4 4 0 0 1 8 0 z" fill="currentColor" />
      <circle cx="22.5" cy="12" r="3.2" fill="currentColor" />
      <line x1="22.5" y1="15" x2="22.5" y2="28" strokeWidth="2.2" {...STROKE} />
      <line x1="22.5" y1="28" x2="19" y2="40" strokeWidth="2" {...STROKE} />
      <line x1="22.5" y1="28" x2="27" y2="40" strokeWidth="2" {...STROKE} />
      <g className="soc-limb soc-hammer">
        <line x1="22.5" y1="18" x2="30" y2="12" strokeWidth="1.9" {...STROKE} />
        <line x1="28" y1="14" x2="33" y2="10" strokeWidth="3" {...STROKE} />
      </g>
    </svg>
  );
}

/** Sitting on a bench; head nods. Sleeps at night (see CSS). */
export function RestFigure() {
  return (
    <svg viewBox="0 0 36 42" className="soc-svg" aria-hidden focusable="false">
      <line x1="2" y1="32" x2="30" y2="32" strokeWidth="2" {...STROKE} />
      <line x1="6" y1="32" x2="6" y2="40" strokeWidth="1.6" {...STROKE} />
      <line x1="26" y1="32" x2="26" y2="40" strokeWidth="1.6" {...STROKE} />
      <line x1="2" y1="24" x2="30" y2="24" strokeWidth="1.2" {...STROKE} />
      <g className="soc-nod">
        <circle cx="12" cy="14" r="3.6" fill="currentColor" />
      </g>
      <line x1="12" y1="17.6" x2="12" y2="27" strokeWidth="2.3" {...STROKE} />
      <line x1="12" y1="27" x2="21" y2="27" strokeWidth="2.1" {...STROKE} />
      <line x1="21" y1="27" x2="21" y2="38" strokeWidth="2.1" {...STROKE} />
      <line x1="12" y1="20" x2="19" y2="25" strokeWidth="1.8" {...STROKE} />
      <g className="soc-zzz">
        <text x="18" y="10" fontSize="7" fill="currentColor" className="font-mono">
          z
        </text>
      </g>
    </svg>
  );
}

/** Standing, pointing at something off-screen — the chart reader. */
export function InspectFigure() {
  return (
    <svg viewBox="0 0 30 42" className="soc-svg" aria-hidden focusable="false">
      <Body />
      <line x1="12" y1="25" x2="8" y2="38" strokeWidth="2.1" {...STROKE} />
      <line x1="12" y1="25" x2="16" y2="38" strokeWidth="2.1" {...STROKE} />
      <line x1="12" y1="13" x2="7" y2="21" strokeWidth="1.9" {...STROKE} />
      <g className="soc-limb soc-point">
        <line x1="12" y1="13" x2="24" y2="11" strokeWidth="1.9" {...STROKE} />
      </g>
      {/* clipboard */}
      <rect x="2" y="18" width="7" height="9" rx="1" fill="none" strokeWidth="1.3" {...STROKE} />
    </svg>
  );
}

/** Light aircraft towing a banner. */
export function PlaneFigure() {
  return (
    <svg viewBox="0 0 96 26" className="soc-svg" aria-hidden focusable="false">
      <path
        d="M2 12 L18 8 L26 8 L32 2 L36 2 L34 8 L44 8 L48 12 L44 16 L34 16 L36 22 L32 22 L26 16 L18 16 Z"
        fill="currentColor"
      />
      <line x1="48" y1="12" x2="58" y2="12" strokeWidth="1" {...STROKE} />
      <g className="soc-banner">
        <rect x="58" y="5" width="36" height="14" rx="2" fill="none" strokeWidth="1.2" {...STROKE} />
        <text
          x="76"
          y="15"
          fontSize="8"
          textAnchor="middle"
          fill="currentColor"
          className="font-mono"
        >
          HIRE ME
        </text>
      </g>
    </svg>
  );
}

export function DogFigure() {
  return (
    <svg viewBox="0 0 26 18" className="soc-svg" aria-hidden focusable="false">
      <ellipse cx="12" cy="8" rx="6.5" ry="3.4" fill="currentColor" />
      <circle cx="20" cy="5.5" r="3.2" fill="currentColor" />
      <path d="M21.5 2.6 L23.5 0.5 L24 3.4 Z" fill="currentColor" />
      <g className="soc-limb soc-tail">
        <line x1="6" y1="7" x2="1" y2="2.5" strokeWidth="1.6" {...STROKE} />
      </g>
      <g className="soc-limb soc-paw-a">
        <line x1="9" y1="10" x2="9" y2="16" strokeWidth="1.6" {...STROKE} />
      </g>
      <g className="soc-limb soc-paw-b">
        <line x1="16" y1="10" x2="16" y2="16" strokeWidth="1.6" {...STROKE} />
      </g>
    </svg>
  );
}

export const FIGURES = {
  walk: WalkFigure,
  cycle: CycleFigure,
  engineer: EngineerFigure,
  build: BuildFigure,
  rest: RestFigure,
  inspect: InspectFigure,
  fly: PlaneFigure,
  dog: DogFigure,
} as const;
