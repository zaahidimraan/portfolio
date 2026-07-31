import { certificates, skillGroups } from "@/content/profile";

export function Skills() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {skillGroups.map((g) => (
        <div key={g.label} className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted">
            {g.label}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {g.items.map((s) => (
              <span
                key={s}
                className="rounded bg-accent-soft px-2 py-0.5 font-mono text-xs text-accent"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Certificates() {
  return (
    <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {certificates.map((c) => (
        <li key={c.name} className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-foreground/85">{c.name}</span>
          <span className="shrink-0 font-mono text-xs text-muted">
            {c.issuer} · {c.date}
          </span>
        </li>
      ))}
    </ul>
  );
}
