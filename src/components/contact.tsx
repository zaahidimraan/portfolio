import { identity } from "@/content/profile";

export function Contact() {
  return (
    <footer id="contact" className="border-t border-border py-14">
      <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-accent">
        Contact
      </h2>
      <p className="mt-4 max-w-xl leading-relaxed text-foreground/90">
        Open to AI engineering roles and interesting agentic-systems problems.
        The fastest way to reach me is email.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={`mailto:${identity.email}`}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {identity.email}
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
          href={identity.github}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          GitHub ↗
        </a>
      </div>
      <p className="mt-10 font-mono text-xs text-muted">
        © {new Date().getFullYear()} {identity.name} · Set in Geist · Next.js static export on
        Cloudflare Pages · no cookies, no trackers · charts are hand-drawn SVG from real data ·
        deployed {new Date().toISOString().slice(0, 10)}
      </p>
    </footer>
  );
}
