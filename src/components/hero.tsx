import { identity } from "@/content/profile";

export function Hero() {
  const [firstName, lastName] = identity.name.split(" ");
  return (
    <section id="top" className="flex min-h-[calc(100svh-3.5rem)] flex-col justify-center py-16">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
        {identity.location}
      </p>
      <h1 className="display-name mt-5">
        {firstName}
        <br />
        <span className="display-outline">{lastName}</span>
      </h1>
      <p className="mt-6 text-xl font-medium tracking-tight sm:text-2xl">{identity.role}</p>
      <p className="mt-6 max-w-2xl leading-relaxed text-foreground/90">{identity.blurb}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={identity.cvPath}
          download
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
        >
          Download CV
        </a>
        <a
          href={identity.github}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-background"
        >
          GitHub ↗
        </a>
        <a
          href={identity.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-background"
        >
          LinkedIn ↗
        </a>
        <a
          href={`mailto:${identity.email}`}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-background"
        >
          Email
        </a>
      </div>
      <a
        href="#impact"
        className="no-print mt-16 inline-flex items-center gap-2 self-start font-mono text-xs uppercase tracking-[0.25em] text-muted transition-colors hover:text-foreground"
      >
        <span aria-hidden className="scroll-cue">
          ↓
        </span>
        Scroll — the numbers speak
      </a>
    </section>
  );
}
