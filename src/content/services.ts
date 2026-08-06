/**
 * Freelance/consulting offerings for the /services page.
 *
 * Same honesty rule as the rest of the site: every capability here is
 * evidenced by work already shown on the portfolio. Nothing is offered that
 * cannot be pointed at.
 */

export type Service = {
  title: string;
  summary: string;
  deliverables: string[];
  /** Anchor on the homepage that demonstrates this capability. */
  proof: { label: string; href: string };
  /** Tool mark shown on the card (SOC-10). Decorative. */
  tool: "gears" | "funnel" | "plug" | "scales" | "gauge";
};

export const services: Service[] = [
  {
    title: "Agentic systems & workflow automation",
    summary:
      "Multi-step agents that route, decide and escalate — with a human in the loop wherever a wrong answer would be expensive.",
    deliverables: [
      "Router and orchestration design across your existing channels and tools",
      "Human-in-the-loop approval paths for anything high-stakes",
      "Observability so you can see what the agent did and why",
    ],
    tool: "gears",
    proof: {
      label: "Omni-channel assistant",
      href: "/#proj-omni-channel-ai-executive-assistant",
    },
  },
  {
    title: "RAG & document AI pipelines",
    summary:
      "Turning messy documents into structured, validated data your systems can actually rely on.",
    deliverables: [
      "Ingestion and layout-aware parsing for real-world file formats",
      "Strict schema extraction with validation at the boundary",
      "Deterministic verification — grounding, plausibility bounds, self-consistency",
    ],
    tool: "funnel",
    proof: { label: "Document AI experience", href: "/#experience" },
  },
  {
    title: "MCP servers & integrations",
    summary:
      "One standard interface between your internal systems and any AI client, instead of bespoke glue for every tool.",
    deliverables: [
      "MCP server exposing your data and actions safely",
      "Tool design that an agent can actually use without hand-holding",
      "Deployment on your infrastructure, with the access boundaries written down",
    ],
    tool: "plug",
    proof: { label: "A live MCP server you can connect to", href: "/#mcp" },
  },
  {
    title: "LLM evaluation & reliability",
    summary:
      "Knowing whether your AI feature works — measured, not assumed — before your users find out for you.",
    deliverables: [
      "Golden dataset and rubric design for your domain",
      "Evaluation harness that runs on every change, with the numbers tracked",
      "LLM-as-a-Judge scoring validated against human review",
    ],
    tool: "scales",
    proof: {
      label: "LLM-as-a-Judge project",
      href: "/#proj-autonomous-recruitment-agent-llm-as-a-judge",
    },
  },
  {
    title: "Cost & latency engineering",
    summary:
      "Same output, materially smaller bill — for teams already running LLMs in production and feeling it.",
    deliverables: [
      "Token accounting to find where spend actually goes",
      "Prompt caching, context compaction and model-tier routing",
      "Local / open-weight model options where they hold up",
    ],
    tool: "gauge",
    proof: { label: "Local-first PII redaction", href: "/#proj-privacy-preserving-pii-redaction-pipeline" },
  },
];

export const engagementModels = [
  {
    name: "Technical review",
    shape: "Fixed price · about a week",
    detail:
      "You have something built or half-built and want an honest read: what will break, what it will cost at volume, what to do next. Written findings you can act on.",
  },
  {
    name: "Proof of concept",
    shape: "Fixed price · two to four weeks",
    detail:
      "One narrow, real use case taken end to end so you can judge feasibility on evidence rather than a demo video.",
  },
  {
    name: "Build & hand over",
    shape: "Scoped project",
    detail:
      "A production pipeline with evaluation, documentation and a handover session, so your team owns it after I leave.",
  },
  {
    name: "Ongoing consulting",
    shape: "Day rate",
    detail:
      "Regular time for architecture review, pairing and unblocking while your team builds the thing themselves.",
  },
] as const;

export const process = [
  { step: "01", name: "Call", detail: "Half an hour on what you're trying to do and whether I'm the right person. No charge." },
  { step: "02", name: "Written scope", detail: "What I'll deliver, what it costs, how long, and what I need from you. Agreed before anything starts." },
  { step: "03", name: "Build in the open", detail: "Regular check-ins and working code you can see, not a reveal at the end." },
  { step: "04", name: "Handover", detail: "Documentation, evaluation results and a walkthrough — so the work outlives the engagement." },
] as const;
