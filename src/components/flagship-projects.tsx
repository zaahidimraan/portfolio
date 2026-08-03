import { flagships } from "@/content/profile";
import { projectAnchor } from "@/lib/slug";
import { FlagshipDiagram } from "./arch-diagrams";
import { Reveal } from "./reveal";

/** Badge label → skill-chip element id, where the skill grid has that chip (DTL-2.3). */
const BADGE_TO_SKILL: Record<string, string> = {
  n8n: "skill-n8n",
  MCP: "skill-model-context-protocol-mcp",
  "LLM-as-a-Judge": "skill-llm-as-a-judge",
  Ragas: "skill-ragas",
  "Arize Phoenix": "skill-arize-phoenix",
  PostgreSQL: "skill-postgresql-pgvector",
  "Fine-tuning": "skill-fine-tuning-lora-qlora",
};

export function FlagshipProjects() {
  return (
    <div className="grid gap-6">
      {flagships.map((p, i) => (
        <Reveal key={p.title}>
          <article
            id={projectAnchor(p.title)}
            className="glow-hover rounded-lg border border-border bg-card p-6 hover:border-foreground/60"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl font-semibold tracking-tight">{p.title}</h3>
              {p.repoUrl && (
                <a
                  href={p.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="u-link font-mono text-sm"
                >
                  Case study ↗
                </a>
              )}
            </div>
            <p className="mt-2 font-medium">{p.outcome}</p>
            <ul className="mt-4 space-y-2">
              {p.bullets.map((b) => (
                <li key={b} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
                  <span aria-hidden className="mt-1">
                    ▸
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.tech.map((t) => {
                const chipId = BADGE_TO_SKILL[t];
                return chipId ? (
                  <button
                    key={t}
                    type="button"
                    data-skill={chipId}
                    title="Jump to this skill"
                    className="cursor-pointer rounded bg-accent-soft px-2 py-0.5 font-mono text-xs text-foreground/90 transition-colors hover:bg-accent hover:text-background"
                  >
                    {t}
                  </button>
                ) : (
                  <span
                    key={t}
                    className="rounded bg-accent-soft px-2 py-0.5 font-mono text-xs text-foreground/90"
                  >
                    {t}
                  </span>
                );
              })}
            </div>
            <figure className="mt-6 border-t border-border pt-5">
              <Reveal className="draw">
                <FlagshipDiagram index={i} />
              </Reveal>
              <figcaption className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted">
                Architecture
              </figcaption>
            </figure>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
