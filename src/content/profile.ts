/**
 * Single source of all personal facts on this site.
 * Rule: every claim here must mirror the master CV (Career HQ, 00-master-cv).
 * Do not add numbers or titles that are not on the CV.
 */

export const identity = {
  name: "Zahid Imran",
  role: "AI Engineer — Agentic Systems, RAG, MCP",
  location: "Manchester, UK",
  siteUrl: "https://zahid-imran.pages.dev",
  email: "zaahidimraan@gmail.com",
  github: "https://github.com/zaahidimraan",
  githubUser: "zaahidimraan",
  linkedin: "https://www.linkedin.com/in/zahid-imran/",
  cvPath: "/Zahid-Imran-CV.pdf",
  blurb:
    "I build production AI systems that have to be right: document-AI pipelines with deterministic verification, agentic workflows with human-in-the-loop control, and LLM evaluation that keeps models honest. Currently at POWWR, where my extraction platform holds ~99.9% schema compliance on real supplier contracts.",
} as const;

export type Flagship = {
  title: string;
  outcome: string;
  bullets: string[];
  tech: string[];
  repoUrl?: string;
};

export const flagships: Flagship[] = [
  {
    title: "Omni-Channel AI Executive Assistant",
    outcome:
      "A 24/7 personal assistant that answers WhatsApp, Instagram and Messenger — and knows when to wake a human.",
    bullets: [
      "Centralized n8n orchestration layer unifying WhatsApp Business, Instagram Graph API and Facebook Messenger.",
      "Router agent classifies incoming messages with an LLM; routine inquiries get context-aware replies, high-priority items go to human-in-the-loop review via a private Telegram bot.",
      "An Observer agent logs interactions to Notion/PostgreSQL and compiles a nightly Daily Activity Briefing; n8n Queue Mode keeps responses sub-second under load.",
    ],
    tech: ["n8n", "Meta APIs", "LLM routing", "Telegram", "PostgreSQL", "Notion"],
  },
  {
    title: "Autonomous Recruitment Agent (LLM-as-a-Judge)",
    outcome:
      "Resume screening that agrees with human recruiters 85% of the time — with 40% fewer false positives.",
    bullets: [
      "Judge agent grades candidates against a strict rubric with per-criterion confidence scores, instead of generic summaries.",
      "Validated on a golden dataset of 100 human-reviewed resumes using Ragas and Arize Phoenix.",
      "Data ingestion standardized with Model Context Protocol (MCP) servers for Google Drive and Airtable — no brittle API glue.",
    ],
    tech: ["LLM-as-a-Judge", "Ragas", "Arize Phoenix", "MCP", "Airtable"],
  },
  {
    title: "Privacy-Preserving PII Redaction Pipeline",
    outcome:
      "PII detection and redaction at near-zero inference cost — no document ever leaves the machine.",
    bullets: [
      "Local-first NLP pipeline detecting and redacting personally identifiable information in sensitive documents.",
      "Replaced cloud APIs with a fine-tuned Microsoft Phi-3 small language model running fully locally.",
      "100% data sovereignty by design — built for strict GDPR/privacy environments.",
    ],
    tech: ["Phi-3 (SLM)", "Fine-tuning", "Edge AI", "GDPR"],
  },
];

export type Role = {
  title: string;
  company: string;
  dates: string;
  bullets: string[];
};

export const experience: Role[] = [
  {
    title: "AI Engineer (Innovation Team)",
    company: "POWWR",
    dates: "Mar 2026 – Present",
    bullets: [
      "Built an end-to-end document-AI pipeline (Next.js, TypeScript, Azure OpenAI GPT-4o, Docling) converting supplier energy price files into validated contracts with strict JSON-schema extraction.",
      "Engineered a deterministic verification layer — grounding, plausibility bounds, self-consistency — reaching ~99.9% schema compliance with zero extra LLM calls.",
      "Co-developed the in-house pipeline-orchestration platform (Angular, .NET, Dagster) replacing a commercial RPA product; new integrations went from weeks to days.",
      "Reconciliation pipelines CRM-match 12,000+ records per run at ~96% auto-match; benchmarking local-model cascades projected to cut extraction costs 70–95%.",
    ],
  },
  {
    title: "Generative AI Engineer",
    company: "Sparkix Technologies",
    dates: "Sep 2024 – Dec 2024",
    bullets: [
      "Built GenAI applications with LLMs and RAG; shipped Flask and FastAPI services to Azure and AWS.",
      "Worked with OpenAI APIs across chatbots, vision-based quality reporting and structured JSON outputs with LangChain.",
    ],
  },
  {
    title: "Generative AI Engineer",
    company: "Horizon Tech Services",
    dates: "May 2024 – Nov 2024",
    bullets: [
      "Speech enhancement with GAN and Transformer models in PyTorch; selected, trained and fine-tuned sep-former and GAN models.",
    ],
  },
  {
    title: "Deep Learning Intern",
    company: "GrayHat · Final Year Project",
    dates: "Sep 2023 – May 2024",
    bullets: [
      "Automatic video dubbing backend (Flask) reaching 85% accuracy; fine-tuned OpenAI Whisper on Urdu, cutting word error rate by 4%.",
    ],
  },
];

export const education = [
  {
    degree: "MSc Data Science (Distinction)",
    school: "University of Salford, Manchester",
    dates: "Jan 2025 – Mar 2026",
  },
  {
    degree: "BSc Computer Science",
    school: "FAST NUCES, Pakistan",
    dates: "Aug 2020 – Jun 2024",
  },
] as const;

export const skillGroups: { label: string; items: string[] }[] = [
  {
    label: "Agentic Orchestration",
    items: ["n8n", "LangGraph", "Model Context Protocol (MCP)", "Claude Code", "Multi-Agent Systems"],
  },
  {
    label: "GenAI & LLMs",
    items: ["Agentic RAG", "LLM-as-a-Judge", "Fine-Tuning (LoRA/QLoRA)", "Structured Outputs", "Azure OpenAI", "Local LLMs (Ollama)", "Prompt Compression"],
  },
  {
    label: "Evaluation & Ops",
    items: ["Ragas", "Arize Phoenix", "Latency (TTFT) Optimization", "LLM Cost Optimization", "Prompt Caching"],
  },
  {
    label: "Data & Vector Engineering",
    items: ["Qdrant", "Pinecone", "PostgreSQL (pgvector)", "Redis (Semantic Caching)"],
  },
  {
    label: "Core Development",
    items: ["Python", "TypeScript", "Next.js", "FastAPI", "Flask", ".NET (C#)", "Docker", "AWS Lambda"],
  },
];

export const certificates = [
  { name: "Claude Code: A Highly Agentic Coding Assistant", issuer: "DeepLearning.AI", date: "2026" },
  { name: "MCP: Build Rich-Context AI Apps with Anthropic", issuer: "DeepLearning.AI", date: "2026" },
  { name: "AI Agentic Design Patterns with AutoGen", issuer: "DeepLearning.AI", date: "Jan 2026" },
  { name: "Pretraining LLM", issuer: "DeepLearning.AI", date: "Jan 2026" },
  { name: "Prompt Compression and Query Optimization", issuer: "DeepLearning.AI", date: "Jan 2026" },
  { name: "Agentic AI", issuer: "DeepLearning.AI", date: "Dec 2025" },
  { name: "Building Agentic RAG with LlamaIndex", issuer: "DeepLearning.AI", date: "Dec 2025" },
  { name: "AWS Academy: Microservices & CI/CD Pipeline Builder", issuer: "AWS", date: "Apr 2024" },
] as const;

/**
 * Repos hidden from the auto-built GitHub grid: profile README, the old
 * portfolio, university coursework and training-internship assignments.
 * Forks are excluded automatically in lib/github.ts.
 */
export const repoDenylist = new Set([
  "zaahidimraan",
  "Zahid--GenerativeAIEngineer",
  "HTML_CSS_BOOTSTRAP",
  "JavaScript",
  "InfoSecProject",
  "Reingold_Thildfod_Apply",
  "DashBoard_FDV_Project",
  "BlockChainNU",
  "StadiumManagementSystem",
  "Exam-Schedule",
  "NextJSFinaceWebApp",
]);
