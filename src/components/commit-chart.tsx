import type { CommitHistory } from "@/lib/github";

const W = 960;
const H = 150;
const PAD_L = 34;
const PAD_B = 22;

/**
 * Commits per month across the public repos (GIT-2). Build-time data,
 * hand-drawn SVG like every other chart on the site. Renders nothing when the
 * fetch failed — no chart beats a fake one.
 */
export function CommitChart({ commits }: { commits: CommitHistory | null }) {
  if (!commits) return null;
  const keys = Object.keys(commits.months).sort();
  if (keys.length < 2) return null;

  const toIdx = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return y * 12 + (m - 1);
  };
  const first = toIdx(keys[0]);
  const last = toIdx(keys[keys.length - 1]);
  const span = last - first + 1;

  const series = Array.from({ length: span }, (_, i) => {
    const idx = first + i;
    const key = `${String(Math.floor(idx / 12)).padStart(4, "0")}-${String((idx % 12) + 1).padStart(2, "0")}`;
    return { idx, key, n: commits.months[key] ?? 0 };
  });
  const max = Math.max(...series.map((s) => s.n));
  const total = series.reduce((sum, s) => sum + s.n, 0);

  const barW = Math.max((W - PAD_L - 8) / span - 2, 2);
  const x = (i: number) => PAD_L + (i / span) * (W - PAD_L - 8);
  const y = (n: number) => H - PAD_B - (n / max) * (H - PAD_B - 12);

  const years: number[] = [];
  for (let idx = first; idx <= last; idx++) {
    if (idx % 12 === 0) years.push(idx / 12);
  }

  return (
    <figure className="my-8">
      <figcaption className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted">
        {total.toLocaleString("en-GB")} commits across my public repos, by month · fetched from
        git at build · busiest month: {max}
      </figcaption>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[640px]"
          role="img"
          aria-label={`Monthly commit history across public repositories: ${total} commits from ${keys[0]} to ${keys[keys.length - 1]}, peaking at ${max} in a single month.`}
        >
          {years.map((year) => {
            const tx = x(year * 12 - first);
            return (
              <g key={year}>
                <line x1={tx} y1={8} x2={tx} y2={H - PAD_B} stroke="currentColor" strokeWidth={1} opacity={0.14} />
                <text x={tx + 4} y={H - 6} fontSize={10} fill="currentColor" opacity={0.55} className="font-mono">
                  {year}
                </text>
              </g>
            );
          })}
          {series.map((s, i) =>
            s.n > 0 ? (
              <rect
                key={s.key}
                x={x(i)}
                y={y(s.n)}
                width={barW}
                height={H - PAD_B - y(s.n)}
                fill="currentColor"
                opacity={0.85}
              >
                <title>{`${s.key} · ${s.n} commit${s.n === 1 ? "" : "s"}`}</title>
              </rect>
            ) : null,
          )}
          <line x1={PAD_L} y1={H - PAD_B} x2={W - 8} y2={H - PAD_B} stroke="currentColor" strokeWidth={1} opacity={0.35} />
        </svg>
      </div>
    </figure>
  );
}
