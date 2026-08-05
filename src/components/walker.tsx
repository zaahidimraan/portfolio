/**
 * A small figure that walks back and forth along the section rule.
 *
 * Built as one inline SVG with CSS-driven limb rotation rather than a sprite
 * sheet: it inherits `currentColor` (so it flips with the theme), scales
 * cleanly, weighs nothing, and needs no image requests. All motion is
 * transform-only so it stays on the compositor.
 *
 * Hidden entirely for reduced-motion users and when printing.
 */
export function Walker({ label }: { label?: string }) {
  return (
    <div className="walker-lane no-print" aria-hidden="true">
      <div className="walker">
        <svg viewBox="0 0 24 44" className="walker-svg" role="presentation" focusable="false">
          {/* head */}
          <circle cx="12" cy="6" r="4" fill="currentColor" />
          {/* torso */}
          <line
            x1="12"
            y1="10"
            x2="12"
            y2="26"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* arms — pivot at the shoulder */}
          <g className="walker-arm walker-arm-back">
            <line
              x1="12"
              y1="13"
              x2="12"
              y2="23"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
          <g className="walker-arm walker-arm-front">
            <line
              x1="12"
              y1="13"
              x2="12"
              y2="23"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
          {/* legs — pivot at the hip */}
          <g className="walker-leg walker-leg-back">
            <line
              x1="12"
              y1="26"
              x2="12"
              y2="40"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
          <g className="walker-leg walker-leg-front">
            <line
              x1="12"
              y1="26"
              x2="12"
              y2="40"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>
      {label && <span className="walker-label font-mono">{label}</span>}
    </div>
  );
}
