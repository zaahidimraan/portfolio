import { education, experience } from "@/content/profile";

export function Experience() {
  return (
    <div>
      <ol className="relative space-y-10 border-l border-border pl-6">
        {experience.map((role) => (
          <li key={`${role.company}-${role.dates}`} className="relative">
            <span
              aria-hidden
              className="absolute -left-[30.5px] top-1.5 size-2.5 rounded-full border-2 border-accent bg-background"
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <h3 className="font-semibold">
                {role.title} <span className="text-muted">· {role.company}</span>
              </h3>
              <span className="font-mono text-xs text-muted">{role.dates}</span>
            </div>
            <ul className="mt-3 space-y-2">
              {role.bullets.map((b) => (
                <li key={b} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
                  <span aria-hidden className="mt-1 text-accent">
                    ▸
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {education.map((e) => (
          <div key={e.degree} className="rounded-lg border border-border bg-card p-4">
            <p className="font-semibold">{e.degree}</p>
            <p className="mt-1 text-sm text-muted">{e.school}</p>
            <p className="mt-2 font-mono text-xs text-muted">{e.dates}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
