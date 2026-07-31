import { education, experience } from "@/content/profile";

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/** "Sep 2024" → months since Jan 2020. Throws on bad input: dates must stay CV-parseable. */
function monthIndex(label: string): number {
  const [mon, year] = label.trim().split(/\s+/);
  const m = MONTHS[mon];
  const y = Number(year);
  if (m === undefined || Number.isNaN(y)) {
    throw new Error(`career-timeline: unparseable date "${label}" — fix profile.ts dates`);
  }
  return (y - 2020) * 12 + m;
}

function parseRange(dates: string, nowIdx: number): { start: number; end: number } {
  const [from, to] = dates.split("–").map((s) => s.trim());
  return {
    start: monthIndex(from),
    end: to === "Present" ? nowIdx : monthIndex(to),
  };
}

type Bar = {
  label: string;
  tooltip: string;
  start: number;
  end: number;
  row: number;
  kind: "work" | "education";
};

/** First-fit row assignment so concurrent roles stack instead of overlapping. */
function assignRows(bars: Omit<Bar, "row">[]): Bar[] {
  const rowEnds: number[] = [];
  return [...bars]
    .sort((a, b) => a.start - b.start)
    .map((bar) => {
      let row = rowEnds.findIndex((end) => bar.start > end);
      if (row === -1) {
        row = rowEnds.length;
        rowEnds.push(bar.end);
      } else {
        rowEnds[row] = bar.end;
      }
      return { ...bar, row };
    });
}

const W = 960;
const PAD = 10;
const ROW_STRIDE = 48;
const BAR_H = 20;

/**
 * Build-time SVG career timeline — zero client JS. Solid bars = work,
 * hatched = education; concurrent roles render in parallel rows.
 * The Experience list right below is the accessible table view.
 */
export function CareerTimeline() {
  const now = new Date();
  const nowIdx = (now.getFullYear() - 2020) * 12 + now.getMonth();

  const work = assignRows(
    experience.map((role) => ({
      label: role.company.split("·")[0].trim(),
      tooltip: `${role.title} · ${role.company} · ${role.dates}`,
      kind: "work" as const,
      ...parseRange(role.dates, nowIdx),
    })),
  );
  const edu = assignRows(
    education.map((e) => ({
      label: e.degree.split("(")[0].trim(),
      tooltip: `${e.degree} · ${e.school} · ${e.dates}`,
      kind: "education" as const,
      ...parseRange(e.dates, nowIdx),
    })),
  );

  const domainStart = Math.min(...[...work, ...edu].map((b) => b.start));
  const domainEnd = nowIdx + 1;
  const innerW = W - 2 * PAD;
  const x = (idx: number) => PAD + ((idx - domainStart) / (domainEnd - domainStart)) * innerW;

  const workRows = Math.max(...work.map((b) => b.row)) + 1;
  const yWork = (row: number) => 8 + row * ROW_STRIDE;
  const yEdu = (row: number) => 8 + workRows * ROW_STRIDE + 6 + row * ROW_STRIDE;
  const eduRows = Math.max(...edu.map((b) => b.row)) + 1;
  const chartBottom = yEdu(eduRows - 1) + 14 + BAR_H + 6;
  const H = chartBottom + 22;

  const firstYear = Math.ceil((domainStart + 1) / 12) + 2020;
  const lastYear = 2020 + Math.floor(domainEnd / 12);
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);

  const renderBar = (bar: Bar, yTop: number) => {
    const bx = x(bar.start);
    const bw = Math.max(x(bar.end) - bx, 10);
    const labelAtEnd = bx > W * 0.85;
    return (
      <g key={bar.tooltip}>
        <title>{bar.tooltip}</title>
        <text
          x={labelAtEnd ? bx + bw : bx}
          y={yTop + 10}
          textAnchor={labelAtEnd ? "end" : "start"}
          fontSize={11}
          fill="currentColor"
          opacity={0.85}
          className="font-mono"
        >
          {bar.label}
        </text>
        <rect
          x={bx}
          y={yTop + 14}
          width={bw}
          height={BAR_H}
          rx={3}
          fill={bar.kind === "work" ? "currentColor" : "url(#tl-hatch)"}
          stroke={bar.kind === "education" ? "currentColor" : "none"}
          strokeWidth={bar.kind === "education" ? 1 : 0}
        />
      </g>
    );
  };

  return (
    <figure>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <figcaption className="font-mono text-[10px] uppercase tracking-wider text-muted">
          Aug 2020 → today · month resolution · hover for detail
        </figcaption>
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-muted">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="fill-ink inline-block h-2.5 w-5 rounded-[2px]" />
            Work
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="fill-hatch inline-block h-2.5 w-5 rounded-[2px] border border-border" />
            Education
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[720px]"
          role="img"
          aria-label={`Career timeline from 2020 to today: ${experience.length} roles and ${education.length} degrees. Full detail is in the experience list below.`}
        >
          <defs>
            <pattern
              id="tl-hatch"
              patternUnits="userSpaceOnUse"
              width={6}
              height={6}
              patternTransform="rotate(45)"
            >
              <line x1={0} y1={0} x2={0} y2={6} stroke="currentColor" strokeWidth={2} />
            </pattern>
          </defs>
          {years.map((year) => {
            const tx = x((year - 2020) * 12);
            return (
              <g key={year}>
                <line
                  x1={tx}
                  y1={4}
                  x2={tx}
                  y2={chartBottom}
                  stroke="currentColor"
                  strokeWidth={1}
                  opacity={0.14}
                />
                <text
                  x={tx + 4}
                  y={chartBottom + 14}
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
          {work.map((bar) => renderBar(bar, yWork(bar.row)))}
          {edu.map((bar) => renderBar(bar, yEdu(bar.row)))}
        </svg>
      </div>
    </figure>
  );
}
