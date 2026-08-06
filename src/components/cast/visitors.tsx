/**
 * Section characters (CAST-3/4/5).
 *
 * Each of these belongs to exactly one section and does exactly one thing that
 * no other section does. That constraint is the brief: six sections, six
 * unmistakably different motions, none of them looping for its own sake.
 *
 * On the archetypes: the brief asked for Spider-Man and Iron Man by name.
 * Recognisable Marvel characters on a public hire-me page are a trademark and
 * copyright exposure, so these are original figures drawn in the site's own
 * line style that read the same way — a climber on a line, a jetpack flier, a
 * caped leaper.
 */

const line = { stroke: "currentColor", fill: "none", strokeLinecap: "round" as const };

/**
 * Rises from behind the card's top edge, hand over hand.
 *
 * The clipping wrapper is what sells it: the figure travels inside a 28px
 * window sitting above the card, so its lower half is genuinely hidden by the
 * edge rather than merely drawn short.
 */
export function CardClimber() {
  return (
    <span className="card-climber" aria-hidden>
      <svg viewBox="0 0 22 30" focusable="false">
        <circle cx="11" cy="7" r="3.6" fill="currentColor" />
        <line x1="11" y1="10.6" x2="11" y2="21" strokeWidth="2.2" {...line} />
        <g className="climb-arm-a">
          <line x1="11" y1="13" x2="3" y2="8" strokeWidth="1.8" {...line} />
        </g>
        <g className="climb-arm-b">
          <line x1="11" y1="13" x2="19" y2="8" strokeWidth="1.8" {...line} />
        </g>
        <line x1="11" y1="21" x2="6" y2="30" strokeWidth="2" {...line} />
        <line x1="11" y1="21" x2="16" y2="30" strokeWidth="2" {...line} />
      </svg>
    </span>
  );
}

export type VisitorKind = "sling" | "jet" | "leap";

/** One arrival per flagship card — never the same one twice. */
export function CardVisitor({ kind }: { kind: VisitorKind }) {
  if (kind === "sling") return <Slinger />;
  if (kind === "jet") return <Flier />;
  return <Leaper />;
}

/** Swings in from the top corner on a line, anchored above the card. */
function Slinger() {
  return (
    <span className="card-visitor visitor-sling" aria-hidden>
      <svg viewBox="0 0 46 74" focusable="false">
        <line x1="42" y1="0" x2="23" y2="34" strokeWidth="1.2" opacity="0.75" {...line} />
        <g className="sling-body">
          <circle cx="23" cy="38" r="4.2" fill="currentColor" />
          <line x1="23" y1="42" x2="23" y2="56" strokeWidth="2.4" {...line} />
          {/* one arm up the line, one flung out */}
          <line x1="23" y1="45" x2="30" y2="35" strokeWidth="1.9" {...line} />
          <line x1="23" y1="45" x2="13" y2="50" strokeWidth="1.9" {...line} />
          <line x1="23" y1="56" x2="16" y2="68" strokeWidth="2.1" {...line} />
          <line x1="23" y1="56" x2="31" y2="64" strokeWidth="2.1" {...line} />
        </g>
      </svg>
    </span>
  );
}

/** Rockets up from below on a thruster. */
function Flier() {
  return (
    <span className="card-visitor visitor-jet" aria-hidden>
      <svg viewBox="0 0 40 74" focusable="false">
        <circle cx="20" cy="16" r="4.4" fill="currentColor" />
        <line x1="20" y1="20.4" x2="20" y2="36" strokeWidth="2.6" {...line} />
        {/* arms swept back, fists down — the classic hover pose */}
        <line x1="20" y1="24" x2="10" y2="31" strokeWidth="2" {...line} />
        <line x1="20" y1="24" x2="30" y2="31" strokeWidth="2" {...line} />
        <line x1="20" y1="36" x2="15" y2="50" strokeWidth="2.2" {...line} />
        <line x1="20" y1="36" x2="25" y2="50" strokeWidth="2.2" {...line} />
        <g className="jet-flame">
          <path d="M15 50 q1 9 -2 15 q6 -3 7 -12" strokeWidth="1.5" {...line} />
          <path d="M25 50 q-1 9 2 15 q-6 -3 -7 -12" strokeWidth="1.5" {...line} />
        </g>
      </svg>
    </span>
  );
}

/** Leaps in from the left, cape trailing. */
function Leaper() {
  return (
    <span className="card-visitor visitor-leap" aria-hidden>
      <svg viewBox="0 0 56 66" focusable="false">
        <path className="leap-cape" d="M24 20 q-16 4 -22 20 q14 -6 24 -6" strokeWidth="1.6" {...line} />
        <circle cx="30" cy="16" r="4.4" fill="currentColor" />
        <line x1="30" y1="20.4" x2="28" y2="36" strokeWidth="2.6" {...line} />
        {/* leading fist forward, trailing arm back */}
        <line x1="29" y1="24" x2="42" y2="18" strokeWidth="2" {...line} />
        <line x1="29" y1="24" x2="19" y2="30" strokeWidth="2" {...line} />
        <line x1="28" y1="36" x2="38" y2="46" strokeWidth="2.2" {...line} />
        <line x1="28" y1="36" x2="20" y2="50" strokeWidth="2.2" {...line} />
      </svg>
    </span>
  );
}

/** Lands on the language bars and taxis between them (CAST-4). */
export function RunwayPlane({ top }: { top: number }) {
  return (
    <span className="runway-plane" style={{ top: `${top}px` }} aria-hidden>
      <svg viewBox="0 0 54 22" focusable="false">
        {/* nose left, so it reads as having landed travelling down the bar */}
        <path d="M4 12 L20 8 L46 8 L52 12 L46 16 L20 16 Z" strokeWidth="1.4" {...line} />
        <path d="M24 8 L18 1 L26 1 Z" strokeWidth="1.3" {...line} />
        <path d="M24 16 L18 21 L26 21 Z" strokeWidth="1.3" {...line} />
        <path d="M42 8 L38 3 L44 3 Z" strokeWidth="1.2" {...line} />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      </svg>
    </span>
  );
}

/** Tows a banner across the top of the experience list (CAST-5.2). */
export function BannerPlane() {
  return (
    <span className="exp-plane" aria-hidden>
      <svg viewBox="0 0 128 24" focusable="false">
        <path d="M96 12 L110 8 L122 12 L110 16 Z" strokeWidth="1.4" {...line} />
        <path d="M104 8 L100 2 L108 2 Z" strokeWidth="1.2" {...line} />
        <line x1="96" y1="12" x2="62" y2="12" strokeWidth="1" opacity="0.6" {...line} />
        <rect x="8" y="4" width="54" height="16" strokeWidth="1.2" {...line} />
        <line x1="16" y1="10" x2="54" y2="10" strokeWidth="1.4" opacity="0.55" {...line} />
        <line x1="16" y1="15" x2="44" y2="15" strokeWidth="1.4" opacity="0.55" {...line} />
      </svg>
    </span>
  );
}
