import { flagships } from "@/content/profile";

export function FlagshipProjects() {
  return (
    <div className="grid gap-6">
      {flagships.map((p) => (
        <article
          key={p.title}
          className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-accent/50"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold">{p.title}</h3>
            {p.repoUrl && (
              <a
                href={p.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-accent hover:underline"
              >
                Code ↗
              </a>
            )}
          </div>
          <p className="mt-2 font-medium text-accent">{p.outcome}</p>
          <ul className="mt-4 space-y-2">
            {p.bullets.map((b) => (
              <li key={b} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
                <span aria-hidden className="mt-1 text-accent">
                  ▸
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {p.tech.map((t) => (
              <span
                key={t}
                className="rounded bg-accent-soft px-2 py-0.5 font-mono text-xs text-accent"
              >
                {t}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
