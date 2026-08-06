import { certificates, type Certificate } from "@/content/profile";
import { ChartInspector } from "./society/chart-workers";

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

const START_YEAR = 2023;

/** "Jan 2026" → month index since Jan 2023; bare "2026" pins to January. */
function certMonth(date: string): number {
  const parts = date.trim().split(/\s+/);
  const year = Number(parts[parts.length - 1]);
  const month = parts.length === 2 ? (MONTHS[parts[0]] ?? 0) : 0;
  if (Number.isNaN(year)) {
    throw new Error(`cert-strip: unparseable date "${date}" — fix profile.ts`);
  }
  return (year - START_YEAR) * 12 + month;
}

const TRACKS: Certificate["track"][] = ["Agentic AI", "Core GenAI", "Cloud & MLOps"];

const W = 960;
const PAD_L = 116;
const PAD_R = 16;
const LANE_H = 34;
const DOT_R = 6;

/**
 * Certificates as three swimlanes on one date axis (DTL-3, revised): lane
 * position carries the track, so no colour or pattern legend is needed and the
 * clustering of each theme over time is visible at a glance.
 * The list below remains the accessible source of record.
 */
export function CertStrip() {
  const now = new Date();
  const domainEnd = (now.getFullYear() - START_YEAR) * 12 + now.getMonth() + 1;
  const x = (m: number) => PAD_L + (m / domainEnd) * (W - PAD_L - PAD_R);

  const H = TRACKS.length * LANE_H + 44;
  const laneY = (i: number) => 16 + i * LANE_H + LANE_H / 2;

  const years = Array.from(
    { length: now.getFullYear() - START_YEAR + 1 },
    (_, i) => START_YEAR + i,
  );

  return (
    <figure className="mb-10">
      <figcaption className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted">
        {certificates.length} certificates · {START_YEAR} → today · one lane per track · hover a dot
      </figcaption>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[640px]"
          role="img"
          aria-label={`Timeline of ${certificates.length} certificates from ${START_YEAR} to today, grouped into ${TRACKS.length} tracks. The full list follows below.`}
        >
          {years.map((year) => {
            const tx = x((year - START_YEAR) * 12);
            return (
              <g key={year}>
                <line
                  x1={tx}
                  y1={8}
                  x2={tx}
                  y2={H - 26}
                  stroke="currentColor"
                  strokeWidth={1}
                  opacity={0.14}
                />
                <text
                  x={tx + 4}
                  y={H - 10}
                  fontSize={10}
                  fill="currentColor"
                  opacity={0.55}
                  className="font-mono"
                >
                  {year}
                </text>
              </g>
            );
          })}

          {TRACKS.map((track, i) => {
            const y = laneY(i);
            const inTrack = certificates.filter((c) => c.track === track);
            // Nudge same-month dots apart so none is hidden underneath another.
            const seen = new Map<number, number>();
            return (
              <g key={track}>
                <text
                  x={0}
                  y={y + 3}
                  fontSize={10}
                  fill="currentColor"
                  opacity={0.7}
                  className="font-mono"
                >
                  {track.toUpperCase()}
                </text>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={W - PAD_R}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={1}
                  opacity={0.18}
                />
                {inTrack.map((cert) => {
                  const month = certMonth(cert.date);
                  const nudge = seen.get(month) ?? 0;
                  seen.set(month, nudge + 1);
                  return (
                    <circle
                      key={cert.name}
                      className="cert-dot"
                      cx={x(month) + nudge * (DOT_R * 2.2)}
                      cy={y}
                      r={DOT_R}
                      fill={cert.issuer === "DeepLearning.AI" ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth={cert.issuer === "DeepLearning.AI" ? 0 : 2}
                    >
                      <title>{`${cert.name} — ${cert.issuer}, ${cert.date}`}</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}
          {/* A reader studying the shelves — decoration, clear of the lanes. */}
          <ChartInspector x={PAD_L - 78} y={H - 8} />
        </svg>
      </div>
      <p className="mt-2 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-wider text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="fill-ink inline-block size-2.5 rounded-full" />
          DeepLearning.AI
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block size-2.5 rounded-full border-2 border-foreground" />
          AWS · Coursera
        </span>
      </p>
    </figure>
  );
}
