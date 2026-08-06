import type { Repo } from "@/lib/github";

const W = 960;
const PAD_L = 150;
const PAD_R = 20;
const ROW_H = 18;
const START_YEAR = 2021;

/**
 * Repo-lifespan timeline: one bar per public repo, spanning first commit to
 * last push (both real GitHub dates). Answers "how long has he been building,
 * and how consistently" — the language chart answers "with what".
 * Filled end-dot = pushed within 3 months; open ring = dormant.
 */
export function RepoTimeline({ repos }: { repos: Repo[] }) {
  const dated = repos
    .filter((r) => r.createdAt && r.pushedAt)
    .map((r) => ({
      ...r,
      start: new Date(r.createdAt),
      end: new Date(r.pushedAt),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (dated.length < 3) return null;

  const now = new Date();
  const toMonths = (d: Date) => (d.getFullYear() - START_YEAR) * 12 + d.getMonth();
  const domainEnd = toMonths(now) + 1;
  const x = (m: number) => PAD_L + (Math.max(m, 0) / domainEnd) * (W - PAD_L - PAD_R);

  const H = dated.length * ROW_H + 34;
  const years = Array.from(
    { length: now.getFullYear() - START_YEAR + 1 },
    (_, i) => START_YEAR + i,
  );
  const freshCutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

  return (
    <figure className="my-8">
      <figcaption className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted">
        {dated.length} public repos · first commit → last push · filled dot = active in the last 3
        months
      </figcaption>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[640px]"
          role="img"
          aria-label={`Lifespan of ${dated.length} public repositories from ${START_YEAR} to today. The repository list below carries the same information.`}
        >
          {years.map((year) => {
            const tx = x((year - START_YEAR) * 12);
            return (
              <g key={year}>
                <line
                  x1={tx}
                  y1={4}
                  x2={tx}
                  y2={H - 22}
                  stroke="currentColor"
                  strokeWidth={1}
                  opacity={0.14}
                />
                <text
                  x={tx + 4}
                  y={H - 8}
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
          {dated.map((repo, i) => {
            const y = 12 + i * ROW_H;
            const bx = x(toMonths(repo.start));
            const bw = Math.max(x(toMonths(repo.end)) - bx, 3);
            const fresh = repo.end >= freshCutoff;
            return (
              <g key={repo.name}>
                <title>{`${repo.name} · ${repo.language ?? "—"} · ${repo.createdAt.slice(0, 7)} → ${repo.pushedAt.slice(0, 7)}`}</title>
                <text
                  x={PAD_L - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={9.5}
                  fill="currentColor"
                  opacity={0.75}
                  className="font-mono"
                >
                  {repo.name.length > 22 ? `${repo.name.slice(0, 21)}…` : repo.name}
                </text>
                <line
                  x1={bx}
                  y1={y}
                  x2={bx + bw}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={0.8}
                />
                <circle
                  cx={bx + bw}
                  cy={y}
                  r={3.5}
                  fill={fresh ? "currentColor" : "var(--background)"}
                  stroke="currentColor"
                  strokeWidth={fresh ? 0 : 1.5}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}
