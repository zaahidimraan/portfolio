import Link from "next/link";

/** Off the map. */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-5 px-5 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">404 — off the map</p>

      <div className="lost-scene" aria-hidden>
        <svg viewBox="0 0 34 38" className="signpost-404" focusable="false">
          <line x1="17" y1="38" x2="17" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 10 h14 l-5 5 h-9 z" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <path d="M17 20 h-13 l5 5 h8 z" stroke="currentColor" strokeWidth="1.4" fill="none" />
        </svg>
        <svg viewBox="0 0 24 44" className="lost-figure" focusable="false">
          <circle cx="12" cy="6" r="3.6" fill="currentColor" />
          <line x1="12" y1="9.6" x2="12" y2="26" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
          <line x1="12" y1="26" x2="7" y2="40" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
          <line x1="12" y1="26" x2="17" y2="40" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
          {/* one hand shading the eyes, looking around */}
          <g className="lost-arm">
            <line x1="12" y1="13" x2="19" y2="8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          </g>
          <line x1="12" y1="13" x2="6" y2="20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">
        There&apos;s nothing built on this plot
      </h1>
      <p className="max-w-md leading-relaxed text-muted">
        You&apos;ve wandered past the edge of the town. The page you&apos;re looking for was
        moved, or never existed here.
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="glow-hover-sm rounded-md bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Back to the main street
        </Link>
        <Link
          href="/services"
          className="glow-hover-sm rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-background"
        >
          Visit the workshop
        </Link>
      </div>
    </main>
  );
}
