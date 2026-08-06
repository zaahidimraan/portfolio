/**
 * Tiny citizens working on the charts, so the data reads as part of the town.
 *
 * These are drawn *inside* the chart SVGs in their own coordinate space, sized
 * to the chart rather than the page. Strictly decorative: aria-hidden, never
 * overlapping a data mark or label, and removed under reduced-motion.
 */

const S = { stroke: "currentColor", strokeLinecap: "round" as const };

/** A surveyor pacing a bar, checking it — used on the career timeline. */
export function Surveyor({
  x,
  y,
  travel,
  duration = 18,
  delay = 0,
}: {
  x: number;
  y: number;
  /** How far along the bar to walk, in chart units. */
  travel: number;
  duration?: number;
  delay?: number;
}) {
  return (
    <g
      className="cw cw-pace"
      aria-hidden
      style={
        {
          ["--cw-travel" as string]: `${travel}px`,
          ["--cw-dur" as string]: `${duration}s`,
          ["--cw-delay" as string]: `${delay}s`,
        } as React.CSSProperties
      }
      transform={`translate(${x} ${y})`}
    >
      <circle cx="0" cy="-11" r="2.1" fill="currentColor" />
      <line x1="0" y1="-9" x2="0" y2="-4" strokeWidth="1.4" {...S} />
      <g className="cw-limb cw-leg-a">
        <line x1="0" y1="-4" x2="0" y2="0" strokeWidth="1.3" {...S} />
      </g>
      <g className="cw-limb cw-leg-b">
        <line x1="0" y1="-4" x2="0" y2="0" strokeWidth="1.3" {...S} />
      </g>
      {/* measuring pole */}
      <line x1="3" y1="-13" x2="3" y2="0" strokeWidth="1" opacity="0.7" {...S} />
    </g>
  );
}

/** Someone standing and pointing — used beside the certificate lanes. */
export function ChartInspector({ x, y }: { x: number; y: number }) {
  return (
    <g className="cw" aria-hidden transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="-12" r="2.3" fill="currentColor" />
      <line x1="0" y1="-10" x2="0" y2="-4" strokeWidth="1.5" {...S} />
      <line x1="0" y1="-4" x2="-2.5" y2="0" strokeWidth="1.4" {...S} />
      <line x1="0" y1="-4" x2="2.5" y2="0" strokeWidth="1.4" {...S} />
      <g className="cw-limb cw-point">
        <line x1="0" y1="-9" x2="6" y2="-11" strokeWidth="1.4" {...S} />
      </g>
    </g>
  );
}

/** A worker with a hard hat, hammering — used on the repo timeline. */
export function ChartBuilder({ x, y }: { x: number; y: number }) {
  return (
    <g className="cw" aria-hidden transform={`translate(${x} ${y})`}>
      <path d="M-2.4 -13 a2.4 2.4 0 0 1 4.8 0 z" fill="currentColor" />
      <circle cx="0" cy="-11.2" r="2" fill="currentColor" />
      <line x1="0" y1="-9.2" x2="0" y2="-4" strokeWidth="1.5" {...S} />
      <line x1="0" y1="-4" x2="-2.4" y2="0" strokeWidth="1.4" {...S} />
      <line x1="0" y1="-4" x2="2.4" y2="0" strokeWidth="1.4" {...S} />
      <g className="cw-limb cw-tap">
        <line x1="0" y1="-8.4" x2="5" y2="-11" strokeWidth="1.4" {...S} />
        <line x1="4" y1="-10.4" x2="7" y2="-12" strokeWidth="2.2" {...S} />
      </g>
    </g>
  );
}
