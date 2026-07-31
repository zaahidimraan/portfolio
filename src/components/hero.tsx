import { identity } from "@/content/profile";

export function Hero() {
  return (
    <section id="top" className="py-16 sm:py-24">
      <p className="mb-3 font-mono text-sm text-accent">{identity.location}</p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        {identity.name}
      </h1>
      <p className="mt-3 text-xl text-muted sm:text-2xl">{identity.role}</p>
      <p className="mt-6 max-w-2xl leading-relaxed text-foreground/90">
        {identity.blurb}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={identity.cvPath}
          download
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Download CV
        </a>
        <a
          href={identity.github}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          GitHub ↗
        </a>
        <a
          href={identity.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          LinkedIn ↗
        </a>
        <a
          href={`mailto:${identity.email}`}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          Email
        </a>
      </div>
    </section>
  );
}
