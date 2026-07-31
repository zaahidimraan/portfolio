import type { Repo } from "@/lib/github";

const PATTERNS = ["fill-ink", "fill-hatch", "fill-dots", "fill-hatch2", "fill-cross", "fill-half"];
const MAX_ROWS = 6;

/**
 * Primary-language distribution across the build-time repo fetch.
 * Bar list, single series: direct labels carry identity (no legend needed);
 * monochrome patterns are decoration, not the only distinguisher.
 */
export function LanguageChart({ repos }: { repos: Repo[] }) {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  let entries = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (entries.length < 2) return null;

  if (entries.length > MAX_ROWS) {
    const rest = entries.slice(MAX_ROWS - 1).reduce((sum, [, n]) => sum + n, 0);
    entries = [...entries.slice(0, MAX_ROWS - 1), ["Other", rest]];
  }
  const max = entries[0][1];
  const total = entries.reduce((sum, [, n]) => sum + n, 0);

  return (
    <figure className="my-8">
      <div role="list">
        {entries.map(([language, count], i) => (
          <div
            key={language}
            role="listitem"
            className="grid grid-cols-[6.5rem_1fr] items-center gap-3 py-1.5"
          >
            <span className="truncate font-mono text-xs text-foreground/85">{language}</span>
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className={`${PATTERNS[i % PATTERNS.length]} h-3.5 rounded-[2px]`}
                style={{ width: `max(${(count / max) * 100}%, 8px)` }}
              />
              <span className="tnum shrink-0 font-mono text-xs text-muted">{count}</span>
            </span>
          </div>
        ))}
      </div>
      <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted">
        Primary language of {total} public repos · fetched from GitHub at build
      </figcaption>
    </figure>
  );
}
