/**
 * Little building glyphs that turn each section number into a street address.
 * Decorative only — the heading text still carries all the meaning.
 */

const S = { stroke: "currentColor", strokeWidth: 1.3, fill: "none", strokeLinejoin: "round" as const };

const SHAPES = {
  /** Records office — a ledger building with a clock. */
  records: (
    <>
      <path d="M2 15 V6 h12 v9 z" {...S} />
      <circle cx="8" cy="9.5" r="2" {...S} />
      <line x1="8" y1="9.5" x2="8" y2="8.2" {...S} />
    </>
  ),
  /** Workshops — pitched roof with a chimney. */
  workshop: (
    <>
      <path d="M2 15 V8 L8 3 L14 8 v7 z" {...S} />
      <path d="M11 5.2 V3 h1.6 v3.4" {...S} />
      <rect x="6.4" y="10" width="3.2" height="5" {...S} />
    </>
  ),
  /** The long road — a signposted street. */
  road: (
    <>
      <path d="M3 15 L6.5 3 M13 15 L9.5 3" {...S} />
      <line x1="8" y1="6" x2="8" y2="8" {...S} />
      <line x1="8" y1="11" x2="8" y2="13.5" {...S} />
    </>
  ),
  /** Toolshed — a lean-to with a tool. */
  toolshed: (
    <>
      <path d="M2.5 15 V7.5 L13.5 5 v10 z" {...S} />
      <line x1="7" y1="9.5" x2="7" y2="13" {...S} />
      <line x1="5.6" y1="9.5" x2="8.4" y2="9.5" {...S} />
    </>
  ),
  /** Library — books on a shelf. */
  library: (
    <>
      <path d="M2 15 V5 h12 v10 z" {...S} />
      <line x1="5" y1="7" x2="5" y2="13" {...S} />
      <line x1="8" y1="7" x2="8" y2="13" {...S} />
      <line x1="11" y1="7" x2="11" y2="13" {...S} />
    </>
  ),
  /** Telegraph office — a mast sending signal. */
  telegraph: (
    <>
      <path d="M4 15 L8 4 L12 15" {...S} />
      <line x1="5.6" y1="10" x2="10.4" y2="10" {...S} />
      <path d="M10.5 3.5 a3 3 0 0 1 2.6 2.6" {...S} />
    </>
  ),
} as const;

export type GlyphName = keyof typeof SHAPES;

export function TownGlyph({ name }: { name: GlyphName }) {
  return (
    <svg
      viewBox="0 0 16 18"
      className="town-glyph"
      aria-hidden="true"
      focusable="false"
    >
      {SHAPES[name]}
    </svg>
  );
}

/** Fingerpost used in the footer — points out of town. */
export function Fingerpost() {
  return (
    <svg viewBox="0 0 40 44" className="signpost" aria-hidden="true" focusable="false">
      <line x1="20" y1="8" x2="20" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12 h22 l6 4 -6 4 H4 z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M36 24 H14 l-6 4 6 4 h22 z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
