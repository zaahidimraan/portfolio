/**
 * The mark (CAST-1).
 *
 * A "Z" drawn as a routing trace — two pads joined by a diagonal with a live
 * node running down it — beside an "I" rule. It reads as signal/routing rather
 * than as a typographic monogram, which is the point: the work is agentic
 * systems, not lettering.
 *
 * Pure `currentColor` line art, so it inverts with the theme, survives forced
 * colours, and stays legible at favicon size (the geometry is deliberately
 * chunky: nothing thinner than 2 units in a 32-unit box).
 */
export function Logo({ className = "logo" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 32" className={className} aria-hidden focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square">
        {/* Z: top rail, diagonal trace, bottom rail */}
        <path d="M7 7 H23" />
        <path className="logo-trace" d="M23 7 L7 25" />
        <path d="M7 25 H23" />
      </g>
      {/* pads where the trace meets the rails */}
      <rect x="20.6" y="4.6" width="4.8" height="4.8" fill="currentColor" />
      <rect x="4.6" y="22.6" width="4.8" height="4.8" fill="currentColor" />
      {/* the node travelling the trace */}
      <circle className="logo-node" cx="15" cy="16" r="3.1" fill="currentColor" />
      {/* I — with real crossbars. Without them a bare stem reads as a pipe
          character sitting between the mark and the wordmark, not a letter. */}
      <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square">
        <path d="M30 7 H38" />
        <path d="M34 7 V25" />
        <path d="M30 25 H38" />
      </g>
    </svg>
  );
}
