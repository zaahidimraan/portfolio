import { identity } from "@/content/profile";
import type { Repo } from "@/lib/github";

export function GitHubGrid({ repos }: { repos: Repo[] }) {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {repos.map((r) => (
          <a
            key={r.name}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/50"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="font-mono text-sm font-semibold group-hover:text-accent">
                {r.name}
              </h4>
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
          className="text-accent hover:underline"
        >
          github.com/{identity.githubUser}
        </a>
      </p>
    </div>
  );
}
