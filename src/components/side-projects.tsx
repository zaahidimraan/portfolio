import { sideProjects } from "@/content/profile";
import { projectAnchor } from "@/lib/slug";

/** Compact grid of the non-flagship CV projects (CNT-1). */
export function SideProjects() {
  return (
    <div className="stagger grid gap-4 sm:grid-cols-2">
      {sideProjects.map((p) => (
        <article
          key={p.title}
          id={projectAnchor(p.title)}
          className="glow-hover rounded-lg border border-border bg-card p-5 hover:border-foreground/60"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="font-semibold tracking-tight">{p.title}</h4>
            {p.repoUrl && (
              <a
                href={p.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="u-link shrink-0 font-mono text-xs"
              >
                Repo ↗
              </a>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-foreground/90">{p.outcome}</p>
          <ul className="mt-3 space-y-1.5">
            {p.bullets.map((b) => (
              <li key={b} className="flex gap-2 text-sm leading-relaxed text-muted">
                <span aria-hidden className="mt-1">
                  ▸
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.tech.map((t) => (
              <span
                key={t}
                className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[11px] text-foreground/90"
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
