import { certificates } from "@/content/profile";

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/** "Jan 2026" → month index since Jan 2024; bare "2026" pins to January (year precision). */
function certMonth(date: string): number {
  const parts = date.trim().split(/\s+/);
  const year = Number(parts[parts.length - 1]);
  const month = parts.length === 2 ? (MONTHS[parts[0]] ?? 0) : 0;
  if (Number.isNaN(year)) {
    throw new Error(`cert-strip: unparseable date "${date}" — fix profile.ts`);
  }
  return (year - 2024) * 12 + month;
}

const W = 960;
const PAD = 14;
const DOT_R = 6;
const DOT_GAP = 17;

/**
 * DTL-3: certificates as dots on a 2024→today axis. Solid = DeepLearning.AI,
 * ring = AWS (pattern, not color). Same-month certs stack vertically.
 * The list below remains the accessible table view.
 */
export function CertStrip() {
  const now = new Date();
  const domainEnd = (now.getFullYear() - 2024) * 12 + now.getMonth() + 1;
  const x = (m: number) => PAD + (m / domainEnd) * (W - 2 * PAD);

  const stacked = new Map<number, number>();
  const dots = certificates.map((cert) => {
    const month = certMonth(cert.date);
    const level = stacked.get(month) ?? 0;
    stacked.set(month, level + 1);
    return { cert, month, level };
  });
  const maxLevel = Math.max(...dots.map((d) => d.level));
  const baseY = 30 + maxLevel * DOT_GAP;
  const H = baseY + 30;

  const years = Array.from(
    { length: now.getFullYear() - 2024 + 1 },
    (_, i) => 2024 + i,
  );

  return (
    <figure className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <figcaption className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {certificates.length} certificates · 2024 → today · hover for detail
        </figcaption>
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-muted">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="fill-ink inline-block size-2.5 rounded-full" />
            DeepLearning.AI
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block size-2.5 rounded-full border-2 border-foreground" />
            AWS
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[640px]"
          role="img"
          aria-label={`${certificates.length} certificates from 2024 to today; the full list follows below.`}
        >
          {years.map((year) => {
            const tx = x((year - 2024) * 12);
            return (
              <g key={year}>
                <line
                  x1={tx}
                  y1={6}
                  x2={tx}
                  y2={baseY + 10}
                  stroke="currentColor"
                  strokeWidth={1}
                  opacity={0.14}
                />
                <text
                  x={tx + 4}
                  y={baseY + 24}
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
          <line
            x1={PAD}
            y1={baseY + 10}
            x2={W - PAD}
            y2={baseY + 10}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.3}
          />
          {dots.map(({ cert, month, level }) => (
            <circle
              key={cert.name}
              cx={x(month)}
              cy={baseY - level * DOT_GAP}
              r={DOT_R}
              fill={cert.issuer === "AWS" ? "none" : "currentColor"}
              stroke="currentColor"
              strokeWidth={cert.issuer === "AWS" ? 2 : 0}
            >
              <title>{`${cert.name} · ${cert.issuer} · ${cert.date}`}</title>
            </circle>
          ))}
        </svg>
      </div>
    </figure>
  );
}
