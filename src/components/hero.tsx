import { identity } from "@/content/profile";
import { StatusNow } from "./status-now";

const seq = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export function Hero() {
  const [firstName, lastName] = identity.name.split(" ");
  return (
    <section
      id="top"
      className="hero-ambient relative flex min-h-[calc(100svh-3.5rem)] flex-col justify-center py-16"
    >
      <div className="grid items-center gap-x-12 gap-y-10 sm:grid-cols-[1fr_auto]">
        <div>
          <p
            className="hero-seq font-mono text-xs uppercase tracking-[0.3em] text-muted"
            style={seq(0)}
          >
            ◆ {identity.location}
          </p>
          <h1 className="display-name mt-5">
            <span className="hero-seq block" style={seq(80)}>
              {firstName}
            </span>
            <span className="hero-seq display-outline block" style={seq(170)}>
              {lastName}
            </span>
          </h1>
          <p
            className="hero-seq mt-6 text-xl font-medium tracking-tight sm:text-2xl"
            style={seq(260)}
          >
            {identity.role}
          </p>
          <p
            className="hero-seq mt-6 max-w-2xl leading-relaxed text-foreground/90"
            style={seq(340)}
          >
            {identity.blurb}
          </p>
          <div className="hero-seq mt-8 flex flex-wrap gap-3" style={seq(420)}>
            <a
              href={identity.cvPath}
              download
              className="glow-hover-sm rounded-md bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
            >
              Download CV
            </a>
            <a
              href={identity.github}
              target="_blank"
              rel="noopener noreferrer"
              className="glow-hover-sm rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-background"
            >
              GitHub ↗
            </a>
            <a
              href={identity.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="glow-hover-sm rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-background"
            >
              LinkedIn ↗
            </a>
            <a
              href={`mailto:${identity.email}`}
              className="glow-hover-sm rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-background"
            >
              Email
            </a>
          </div>
        </div>
        <div
          className="portrait-wrap hero-seq relative mx-auto w-52 sm:w-64 lg:w-72"
          style={seq(500)}
        >
          {/* WebP is 91% smaller than the PNG and this is the LCP element. */}
          <picture>
            <source srcSet="/portrait.webp" type="image/webp" />
            <img
              src="/portrait.png"
              alt="Zahid Imran, AI Engineer based in Manchester, UK"
              width={577}
              height={493}
              fetchPriority="high"
              decoding="async"
              className="portrait-img relative h-auto w-full"
            />
          </picture>
        </div>
      </div>
      <div className="hero-seq" style={seq(580)}>
        <StatusNow />
      </div>
      <a
        href="#impact"
        className="hero-seq no-print mt-12 inline-flex items-center gap-2 self-start font-mono text-xs uppercase tracking-[0.25em] text-muted transition-colors hover:text-foreground"
        style={seq(660)}
      >
        <span aria-hidden className="scroll-cue">
          ↓
        </span>
        Scroll — the numbers speak
      </a>
    </section>
  );
}
