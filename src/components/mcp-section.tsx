import { identity } from "@/content/profile";

const MCP_URL = "https://ask-zahid.zaahidimraan.workers.dev";

const TOOLS = [
  ["get_profile", "who he is, where, what he's open to"],
  ["get_experience", "every role with its quantified results"],
  ["get_projects", "flagships and side projects, with the tech"],
  ["get_skills", "skills by category"],
  ["get_education", "degrees, grades, modules"],
  ["get_certifications", "all 15 certificates"],
  ["get_metrics", "the headline numbers"],
  ["search_profile", "free-text — “has he used X?”"],
  ["get_cv", "CV PDF and profile links"],
];

/**
 * The portfolio talks back: a public MCP endpoint any AI client can connect to
 * and interrogate. Deliberately prominent — it is itself the proof of the MCP
 * claim on the CV.
 */
export function McpSection() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="max-w-2xl leading-relaxed text-foreground/90">
        Don&apos;t read a CV — <strong className="font-semibold">interrogate one</strong>. This
        portfolio publishes a live Model Context Protocol server, so Claude (or any MCP client) can
        answer questions about my work from the same data this page renders. It never invents: ask
        about something I haven&apos;t done and it says so.
      </p>

      <div className="mt-5 overflow-x-auto">
        <code className="block rounded border border-border bg-accent-soft px-3 py-2 font-mono text-xs">
          claude mcp add --transport http zahid {MCP_URL}
        </code>
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted">
        or paste the URL into claude.ai → settings → connectors
      </p>

      <ul className="stagger mt-6 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {TOOLS.map(([name, what]) => (
          <li key={name} className="flex items-baseline gap-2 text-sm">
            <code className="shrink-0 font-mono text-xs text-foreground">{name}</code>
            <span className="text-muted">{what}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={MCP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="glow-hover-sm rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-background"
        >
          View the endpoint ↗
        </a>
        <a
          href={`${identity.github}/portfolio/tree/master/public-mcp`}
          target="_blank"
          rel="noopener noreferrer"
          className="glow-hover-sm rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-background"
        >
          Source ↗
        </a>
      </div>
    </div>
  );
}
