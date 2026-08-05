import {
  certificates,
  education,
  experience,
  flagships,
  identity,
  skillGroups,
} from "@/content/profile";

/**
 * Structured data for search engines and AI answer engines.
 *
 * Everything here restates facts already visible on the page — schema that
 * declares things the page doesn't show is a ranking liability, not a win.
 * Subject to the same publication rules as the rest of the site (AGENTS.md).
 */

const PERSON_ID = `${identity.siteUrl}/#person`;

export const personSchema = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: identity.name,
  givenName: "Zahid",
  familyName: "Imran",
  jobTitle: "AI Engineer",
  description:
    "AI Engineer in Manchester, UK specialising in agentic systems, retrieval-augmented generation, Model Context Protocol and LLM evaluation.",
  email: `mailto:${identity.email}`,
  url: identity.siteUrl,
  image: `${identity.siteUrl}/portrait.webp`,
  sameAs: [identity.github, identity.linkedin],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Manchester",
    addressRegion: "England",
    addressCountry: "GB",
  },
  worksFor: { "@type": "Organization", name: experience[0].company },
  alumniOf: education.map((e) => ({
    "@type": "EducationalOrganization",
    name: e.school,
  })),
  knowsAbout: [
    "Agentic AI systems",
    "Retrieval-Augmented Generation (RAG)",
    "Model Context Protocol (MCP)",
    "LLM evaluation and LLM-as-a-Judge",
    "Document AI and structured extraction",
    "LLM cost optimisation",
    "Fine-tuning small language models",
    ...skillGroups.flatMap((g) => g.items).slice(0, 12),
  ],
  hasCredential: certificates.slice(0, 8).map((c) => ({
    "@type": "EducationalOccupationalCredential",
    name: c.name,
    credentialCategory: "certificate",
    recognizedBy: { "@type": "Organization", name: c.issuer },
  })),
};

/** The homepage is a profile page about a person — the correct type for it. */
export function homeSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${identity.siteUrl}/#webpage`,
        url: identity.siteUrl,
        name: `${identity.name} — AI Engineer, Manchester UK`,
        mainEntity: { "@id": PERSON_ID },
        isPartOf: { "@id": `${identity.siteUrl}/#website` },
      },
      {
        "@type": "WebSite",
        "@id": `${identity.siteUrl}/#website`,
        url: identity.siteUrl,
        name: `${identity.name} — Portfolio`,
        publisher: { "@id": PERSON_ID },
        inLanguage: "en-GB",
      },
      personSchema,
      ...flagships.map((p, i) => ({
        "@type": "CreativeWork",
        name: p.title,
        abstract: p.outcome,
        author: { "@id": PERSON_ID },
        keywords: p.tech.join(", "),
        position: i + 1,
      })),
    ],
  };
}

export type Faq = { q: string; a: string };

/** Q&A pairs that AI answer engines can lift directly. */
export const servicesFaqs: Faq[] = [
  {
    q: "What AI engineering services do you offer?",
    a: "Agentic system design and build, retrieval-augmented generation (RAG) pipelines, Model Context Protocol (MCP) servers and integrations, LLM evaluation harnesses, and cost optimisation for teams already running LLMs in production.",
  },
  {
    q: "Do you work with startups as well as established companies?",
    a: "Yes. Engagements range from a short technical review or proof of concept for a small team, through to building and handing over a production pipeline with an evaluation suite.",
  },
  {
    q: "How do you price freelance AI engineering work?",
    a: "Fixed price for scoped pieces of work such as a proof of concept, an evaluation harness or an MCP integration, and a day rate for ongoing consulting. Scope and price are agreed before any work starts.",
  },
  {
    q: "What is an MCP server and why would my team want one?",
    a: "A Model Context Protocol server exposes your internal systems to AI clients through one standard interface, so an assistant can query your data without bespoke integration code for every tool. This portfolio publishes one you can connect to and try.",
  },
  {
    q: "How do you make sure an LLM feature is actually reliable?",
    a: "By measuring it. That means a golden dataset, an evaluation harness that runs on every change, deterministic verification around model output where correctness matters, and grounding checks so answers can be traced to a source.",
  },
  {
    q: "Where are you based and do you work remotely?",
    a: "Manchester, United Kingdom. Remote work across UK and European time zones, with on-site available in the North West.",
  },
];

export function servicesSchema(serviceNames: string[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${identity.siteUrl}/services/#webpage`,
        url: `${identity.siteUrl}/services`,
        name: "AI Engineering Services — Zahid Imran",
        isPartOf: { "@id": `${identity.siteUrl}/#website` },
        breadcrumb: { "@id": `${identity.siteUrl}/services/#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${identity.siteUrl}/services/#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: identity.siteUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "Services",
            item: `${identity.siteUrl}/services`,
          },
        ],
      },
      {
        "@type": "ProfessionalService",
        "@id": `${identity.siteUrl}/services/#service`,
        name: "Zahid Imran — AI Engineering",
        description:
          "Freelance AI engineering: agentic systems, RAG pipelines, MCP servers, LLM evaluation and cost optimisation.",
        provider: { "@id": PERSON_ID },
        areaServed: [
          { "@type": "Country", name: "United Kingdom" },
          { "@type": "Place", name: "Remote (Europe)" },
        ],
        availableLanguage: "English",
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "AI engineering services",
          itemListElement: serviceNames.map((name, i) => ({
            "@type": "Offer",
            position: i + 1,
            itemOffered: { "@type": "Service", name },
          })),
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${identity.siteUrl}/services/#faq`,
        mainEntity: servicesFaqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}
