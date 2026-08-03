"use client";

import { useMemo, useState } from "react";
import { identity } from "@/content/profile";
import type { Repo } from "@/lib/github";

const PATTERNS = ["fill-ink", "fill-hatch", "fill-dots", "fill-hatch2", "fill-cross", "fill-half"];
const MAX_ROWS = 6;

/**
 * Language chart ⇄ repo grid, linked (INT-2): clicking a language row
 * filters the grid; clicking it again (or the clear chip) resets.
 * SSR/no-JS renders the full unfiltered grid.
 */
export function GitHubSection({ repos }: { repos: Repo[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  const entries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const repo of repos) {
      if (repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
    }
    let list = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (list.length > MAX_ROWS) {
      const rest = list.slice(MAX_ROWS - 1).reduce((sum, [, n]) => sum + n, 0);
      list = [...list.slice(0, MAX_ROWS - 1), ["Other", rest] as [string, number]];
    }
    return list;
  }, [repos]);

  const named = entries.slice(0, entries.length).map(([l]) => l);
  const visible =
    selected === null
      ? repos
      : selected === "Other"
        ? repos.filter((r) => r.language !== null && !named.slice(0, -1).includes(r.language))
        : repos.filter((r) => r.language === selected);

  const max = entries[0]?.[1] ?? 0;
  const total = entries.reduce((sum, [, n]) => sum + n, 0);
  const toggle = (language: string) =>
    setSelected((cur) => (cur === language ? null : language));

  if (entries.length < 2) return <RepoGrid repos={repos} />;

  return (
    <div>
      <figure className="my-8">
        <div>
          {entries.map(([language, count], i) => {
            const active = selected === language;
            const dimmed = selected !== null && !active;
            return (
              <button
                key={language}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(language)}
                className={`grid w-full cursor-pointer grid-cols-[6.5rem_1fr] items-center gap-3 rounded py-1.5 text-left transition-opacity ${
                  dimmed ? "opacity-40" : ""
                }`}
              >
                <span
                  className={`truncate font-mono text-xs ${active ? "font-bold" : ""} text-foreground/85`}
                >
                  {language}
                </span>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`${PATTERNS[i % PATTERNS.length]} h-3.5 rounded-[2px]`}
                    style={{ width: `max(${(count / max) * 100}%, 8px)` }}
                  />
                  <span className="tnum shrink-0 font-mono text-xs text-muted">{count}</span>
                </span>
              </button>
            );
          })}
        </div>
        <figcaption className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted">
          <span>
            Primary language of {total} public repos · fetched at build · click a bar to filter
          </span>
          {selected !== null && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded border border-border px-2 py-0.5 text-foreground transition-colors hover:bg-accent hover:text-background"
            >
              showing {visible.length} of {repos.length} · clear ✕
            </button>
          )}
        </figcaption>
      </figure>
      <RepoGrid repos={visible} />
    </div>
  );
}

function RepoGrid({ repos }: { repos: Repo[] }) {
  return (
    <div>
      <div className="stagger grid gap-4 sm:grid-cols-2">
        {repos.map((r) => (
          <a
            key={r.name}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group glow-hover rounded-lg border border-border bg-card p-4 hover:-translate-y-0.5 hover:border-foreground/60"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="font-mono text-sm font-semibold">{r.name}</h4>
              {r.stars > 0 && (
                <span className="shrink-0 font-mono text-xs text-muted">★ {r.stars}</span>
              )}
            </div>
            {r.description && (
              <p className="mt-2 line-clamp-2 text-sm text-muted">{r.description}</p>
            )}
            {r.language && (
              <p className="mt-3 font-mono text-xs text-muted">{r.language}</p>
            )}
          </a>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">
        More on{" "}
        <a
          href={identity.github}
          target="_blank"
          rel="noopener noreferrer"
          className="u-link text-foreground"
        >
          github.com/{identity.githubUser}
        </a>
      </p>
    </div>
  );
}
