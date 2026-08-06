import type { Metadata } from "next";
import Link from "next/link";
import { EnquiryForm } from "@/components/enquiry-form";
import { Nav } from "@/components/nav";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { identity } from "@/content/profile";
import { engagementModels, process, services } from "@/content/services";
import { servicesFaqs, servicesSchema } from "@/lib/seo";

const TITLE = "AI Engineering Services — Agentic Systems, RAG & MCP";
const DESCRIPTION =
  "Hire a Manchester-based AI engineer for agentic systems, RAG pipelines, MCP servers, LLM evaluation and cost engineering. Fixed-price scopes or day rate, UK and remote.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/services" },
  openGraph: {
    title: `${TITLE} — ${identity.name}`,
    description: DESCRIPTION,
    url: `${identity.siteUrl}/services`,
    type: "website",
  },
};

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(servicesSchema(services.map((s) => s.title))),
        }}
      />
      <Nav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5">
        <section className="py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
            ◆ Available for freelance &amp; consulting
          </p>
          <h1 className="display-name mt-5 !text-[clamp(2.5rem,7vw,4.5rem)]">
            Work with me
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/90">
            I build AI systems that have to be right — and prove they are. If you have an LLM
            feature that works in a demo but not in production, an integration nobody wants to
            maintain, or a bill that grew faster than the usage, that&apos;s the work I do.
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">
            Everything I offer below is something you can already see working on this site. No
            capability listed here is one I can&apos;t point at.
          </p>
        </section>

        <Section
          id="services"
          number="01"
          title="What I do"
          intro="Five things, each with a piece of work behind it"
        >
          <div className="stagger grid gap-5">
            {services.map((service) => (
              <Reveal key={service.title}>
                <article className="glow-hover rounded-lg border border-border bg-card p-6 hover:border-foreground/60">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {service.title}
                  </h2>
                  <p className="mt-2 font-medium text-foreground/90">{service.summary}</p>
                  <ul className="mt-4 space-y-2">
                    {service.deliverables.map((d) => (
                      <li key={d} className="flex gap-2 text-sm leading-relaxed text-muted">
                        <span aria-hidden className="mt-1">
                          ▸
                        </span>
                        {d}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={service.proof.href}
                    className="u-link mt-4 inline-block font-mono text-xs uppercase tracking-wider"
                  >
                    Proof: {service.proof.label} →
                  </a>
                </article>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section
          id="engagements"
          number="02"
          title="How we'd work"
          intro="Pick the shape that fits — scope and price agreed before anything starts"
        >
          <div className="stagger grid gap-4 sm:grid-cols-2">
            {engagementModels.map((model) => (
              <div key={model.name} className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold">{model.name}</h3>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
                  {model.shape}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{model.detail}</p>
              </div>
            ))}
          </div>

          <ol className="stagger mt-10 grid gap-4 sm:grid-cols-4">
            {process.map((p) => (
              <li key={p.step} className="border-t border-border pt-3">
                <span className="font-mono text-xs text-muted">{p.step}</span>
                <h3 className="mt-1 font-semibold">{p.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{p.detail}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          id="enquire"
          number="03"
          title="Leave a note at the workshop"
          intro="A couple of sentences is plenty — I reply to everything within a couple of days"
        >
          <Reveal>
            <EnquiryForm />
          </Reveal>
        </Section>

        <Section
          id="faq"
          number="04"
          title="Questions"
          intro="The ones I get asked most"
        >
          <div className="stagger grid gap-5">
            {servicesFaqs.map((faq) => (
              <div key={faq.q} className="border-t border-border pt-4">
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{faq.a}</p>
              </div>
            ))}
          </div>
        </Section>

        <footer className="border-t border-border py-14">
          <p className="max-w-xl leading-relaxed text-foreground/90">
            Not ready to enquire? Connect an AI client to my MCP server and interrogate my
            experience first — or just read the work.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="glow-hover-sm rounded-md bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
            >
              See the work
            </Link>
            <Link
              href="/#mcp"
              className="glow-hover-sm rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-background"
            >
              Ask my MCP server
            </Link>
            <a
              href={identity.cvPath}
              download
              className="glow-hover-sm rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-background"
            >
              Download CV
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
