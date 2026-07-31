import { status } from "@/content/status";

/** "Now" strip — auto-updatable via the portfolio MCP server. */
export function StatusNow() {
  return (
    <aside
      aria-label="Current status"
      className="mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-y border-border py-3"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground">
        Now
      </span>
      <span className="text-sm text-foreground/85">{status.focus}</span>
      <span className="text-sm text-muted">{status.availability}</span>
      <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted">
        updated {status.updated}
      </span>
    </aside>
  );
}
