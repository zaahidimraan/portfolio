/**
 * Single source of all personal facts on this site.
 *
 * Rule 1: every claim here must mirror the master CV (Career HQ, 00-master-cv).
 *         Do not add numbers or titles that are not on the CV.
 * Rule 2 (HARD, 2026-08-04): nothing derived from POWWR internal work is
 *         published — no metrics, no architecture, no internal initiatives.
 *         Employer name, role title and generic capability only.
 *         Full contract in ../../AGENTS.md.
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
    "I build production AI systems that have to be right: document-AI pipelines with deterministic verification, agentic workflows with human-in-the-loop control, and LLM evaluation that keeps models honest. Currently an AI Engineer at POWWR in Manchester, working on document AI, agentic tooling and the cost engineering that makes both viable at scale.",
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
    repoUrl: "https://github.com/zaahidimraan/omni-channel-ai-assistant",
  },
  {
    title: "Autonomous Recruitment Agent (LLM-as-a-Judge)",
    outcome:
      "Resume screening that agrees with human recruiters 85% of the time — with 40% fewer false positives.",
    bullets: [
      "Judge agent grades candidates against a strict rubric with per-criterion confidence scores, instead of generic summaries.",
      "Validated on a golden dataset of 100 human-reviewed resumes using Ragas and Arize Phoenix.",
      "Data ingestion standardized with Model Context Protocol (MCP) servers for Google Drive and Airtable — no brittle API glue.",
      "The judging core is open source and runnable: rubric grading, position-bias measurement, self-consistency and human-agreement scoring, with 37 tests that pass offline.",
    ],
    tech: ["LLM-as-a-Judge", "Ragas", "Arize Phoenix", "MCP", "Airtable"],
    repoUrl: "https://github.com/zaahidimraan/llm-judge-recruitment-agent",
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
    repoUrl: "https://github.com/zaahidimraan/local-pii-redaction-pipeline",
  },
];

export type SideProject = {
  title: string;
  outcome: string;
  bullets: string[];
  tech: string[];
  /** Public repo, where one exists. */
  repoUrl?: string;
};

/**
 * Projects beyond the three flagships — all from the master CV's PROJECTS
 * section. Rendered as a compact grid under the flagship cards.
 */
export const sideProjects: SideProject[] = [
  {
    title: "Agentic Travel Intelligence Dashboard",
    outcome:
      "An agent that queries, filters and ranks hotels on its own — then feeds a live BI dashboard.",
    bullets: [
      "Self-directed agentic workflow using the Google Maps API and function calling to rank hotels against complex constraints (price, rating, proximity).",
      "ETL pipeline transforming raw API JSON into structured business intelligence for a real-time PowerBI dashboard.",
    ],
    tech: ["Function calling", "Google Maps API", "ETL", "PowerBI"],
  },
  {
    title: "Speech Enhancement with Transformers",
    outcome: "Audio restoration at 14 dB SI-SNR and 2.25 PESQ, served in real time.",
    bullets: [
      "Fine-tuned a Transformer architecture for audio restoration, reaching 14 dB SI-SNR and 2.25 PESQ.",
      "Deployed on Streamlit Cloud with an inference pipeline tuned for real-time audio streams at minimal latency.",
    ],
    tech: ["PyTorch", "Transformers", "SpeechBrain", "Streamlit"],
    repoUrl: "https://github.com/zaahidimraan/NoiseRemoverGAN",
  },
  {
    title: "Localized Text-to-Speech (XTTS-v2)",
    outcome: "A TTS voice that finally sounds right in Asian English accents.",
    bullets: [
      "Fine-tuned XTTS-v2 on a custom Asian-English accent dataset via transfer learning, improving prosody and naturalness for underrepresented dialects.",
      "Built an automated audio preprocessing pipeline (clean, normalize, segment) for high-fidelity convergence.",
    ],
    tech: ["XTTS-v2", "Transfer learning", "Audio pipelines"],
    repoUrl: "https://github.com/zaahidimraan/XTTS-v2",
  },
  {
    title: "DubLingo — Urdu→Arabic Drama Dubbing",
    outcome:
      "Automating the dubbing of Urdu drama into Arabic, so the work reaches an audience it never had.",
    bullets: [
      "Built with the UrduX Lab team during the Grayhat internship: LLM-driven translation feeding an automated dubbing pipeline.",
      "Paired with a Whisper model fine-tuned on Urdu that cut word error rate by 4%.",
    ],
    tech: ["LLMs", "Whisper", "Python", "Speech pipelines"],
  },
  {
    title: "Emotion Detection from Voice",
    outcome: "Reading emotion from speech at 72% accuracy across four model architectures.",
    bullets: [
      "Compared CNN, ANN, LSTM and hybrid CNN+LSTM models on the same speech-emotion task.",
      "The hybrid architecture reached 72% accuracy — the strongest of the four.",
    ],
    tech: ["CNN", "LSTM", "Deep Learning", "PyTorch"],
  },
  {
    title: "FOG Prediction Pipeline (MLOps)",
    outcome: "A full training-to-deployment loop that runs itself on every commit.",
    bullets: [
      "End-to-end MLOps pipeline with GitHub Actions and Docker automating collection, preprocessing, training and deployment.",
      "MLflow for experiment tracking and model registry, DVC for data versioning — every run reproducible.",
    ],
    tech: ["MLflow", "DVC", "Docker", "GitHub Actions"],
    repoUrl: "https://github.com/zaahidimraan/AirQaulityChecker_MLops",
  },
];

export type Stat = {
  prefix?: string;
  value: number;
  decimals?: number;
  suffix: string;
  label: string;
  source: string;
  /** Anchor of the section that substantiates this number (INT-1.3). */
  href: string;
};

/**
 * Headline numbers for the Impact section.
 *
 * HARD RULE (2026-08-04): no figure derived from POWWR data appears here or
 * anywhere else public — POWWR has not permitted publication of its work
 * detail. Every stat below comes from Zahid's own projects or prior roles
 * already documented on his CV. See ../../AGENTS.md.
 */
export const stats: Stat[] = [
  {
    value: 85,
    suffix: "%",
    label: "agreement with human recruiters",
    source: "Flagship · LLM-as-a-Judge",
    href: "#proj-autonomous-recruitment-agent-llm-as-a-judge",
  },
  {
    prefix: "−",
    value: 40,
    suffix: "%",
    label: "false positives in resume screening",
    source: "Flagship · LLM-as-a-Judge",
    href: "#proj-autonomous-recruitment-agent-llm-as-a-judge",
  },
  {
    value: 2.25,
    decimals: 2,
    suffix: " PESQ",
    label: "perceptual quality on transformer speech restoration",
    source: "Project · speech enhancement",
    href: "#projects",
  },
  {
    value: 14,
    suffix: " dB",
    label: "SI-SNR on transformer speech restoration",
    source: "Project · speech enhancement",
    href: "#projects",
  },
  {
    value: 4,
    suffix: "%",
    label: "word-error-rate cut fine-tuning Whisper on Urdu",
    source: "GrayHat · final year project",
    href: "#exp-grayhat",
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
    title: "AI Engineer",
    company: "POWWR",
    dates: "Mar 2026 – Present",
    bullets: [
      "Build production document-AI pipelines that turn unstructured business documents into validated, structured records.",
      "Design deterministic verification around model output — grounding to source text, plausibility bounds, self-consistency — so extractions can be trusted without additional model calls.",
      "Work on internal automation and data-reconciliation tooling, and on evaluation practice for AI features heading into production.",
      "Research cost-efficient inference: token accounting, prompt caching, context compaction, and local/open-weight model cascades.",
      "Lead AI enablement for engineering colleagues — agentic workflows, model selection, token economics and MCP connectors.",
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
    detail:
      "Advanced Databases · Big Data Tools & Techniques · Machine Learning and Data Mining · Applied Statistics and Data Visualization",
  },
  {
    // 3.16/4 confirmed by Zahid against the transcript, 2026-08-04.
    // (LinkedIn shows 3.11 CGPA and is the incorrect one — needs fixing there.)
    degree: "BSc Computer Science (GPA 3.16/4)",
    school: "FAST NUCES, Pakistan",
    dates: "Aug 2020 – Jun 2024",
    detail:
      "Artificial Intelligence · Statistical Modeling · Deep Learning · MLOps · Generative AI · Cloud Computing · Distributed Data Engineering",
  },
] as const;

export const skillGroups: { label: string; items: string[] }[] = [
  {
    label: "Agentic Orchestration",
    items: ["n8n", "LangGraph", "Model Context Protocol (MCP)", "Claude Code", "Multi-Agent Systems", "ReAct / Plan-and-Execute", "Function Calling"],
  },
  {
    label: "GenAI & LLMs",
    items: ["Agentic RAG", "LLM-as-a-Judge", "Fine-Tuning (LoRA/QLoRA)", "Structured Outputs", "Azure OpenAI", "Local LLMs (Ollama)", "Prompt Compression", "Voice Agents"],
  },
  {
    label: "Evaluation & Ops",
    items: ["Ragas", "Arize Phoenix", "Latency (TTFT) Optimization", "LLM Cost Optimization", "Prompt Caching", "MLflow", "DVC"],
  },
  {
    label: "Data & Vector Engineering",
    items: ["Qdrant", "Pinecone", "PostgreSQL (pgvector)", "Redis (Semantic Caching)", "Airtable"],
  },
  {
    label: "Core Development",
    items: ["Python", "TypeScript", "Next.js", "FastAPI", "Flask", ".NET (C#)", "Docker", "AWS Lambda", "PyTorch"],
  },
];

/**
 * DTL-2: skill → the entries on this page that evidence it.
 * Hand-audited against the bullets above — a skill appears here ONLY when a
 * bullet explicitly supports it. Unmapped skills render as plain chips.
 * Values are anchor ids (see lib/slug.ts).
 */
export const skillLinks: Record<string, string[]> = {
  n8n: ["proj-omni-channel-ai-executive-assistant"],
  "Multi-Agent Systems": ["proj-omni-channel-ai-executive-assistant"],
  "Model Context Protocol (MCP)": ["proj-autonomous-recruitment-agent-llm-as-a-judge"],
  "LLM-as-a-Judge": ["proj-autonomous-recruitment-agent-llm-as-a-judge"],
  Ragas: ["proj-autonomous-recruitment-agent-llm-as-a-judge"],
  "Arize Phoenix": ["proj-autonomous-recruitment-agent-llm-as-a-judge"],
  "Agentic RAG": ["exp-sparkix-technologies"],
  "Fine-Tuning (LoRA/QLoRA)": [
    "proj-privacy-preserving-pii-redaction-pipeline",
    "exp-horizon-tech-services",
    "exp-grayhat",
  ],
  "Structured Outputs": ["exp-powwr", "exp-sparkix-technologies"],
  // Azure OpenAI was evidenced by a POWWR stack detail that is no longer
  // published; Sparkix's cloud-deployment bullet still carries it.
  "Azure OpenAI": ["exp-sparkix-technologies"],
  "Local LLMs (Ollama)": ["proj-privacy-preserving-pii-redaction-pipeline"],
  "LLM Cost Optimization": ["exp-powwr"],
  "Latency (TTFT) Optimization": ["proj-omni-channel-ai-executive-assistant"],
  "PostgreSQL (pgvector)": ["proj-omni-channel-ai-executive-assistant"],
  "Function Calling": ["proj-agentic-travel-intelligence-dashboard"],
  "Voice Agents": ["exp-horizon-tech-services", "proj-localized-text-to-speech-xtts-v2"],
  CNN: ["proj-emotion-detection-from-voice"],
  LSTM: ["proj-emotion-detection-from-voice"],
  MLflow: ["proj-fog-prediction-pipeline-mlops"],
  DVC: ["proj-fog-prediction-pipeline-mlops"],
  PyTorch: ["exp-horizon-tech-services", "proj-speech-enhancement-with-transformers"],
  Docker: ["proj-fog-prediction-pipeline-mlops"],
  Python: ["exp-sparkix-technologies", "exp-horizon-tech-services", "exp-grayhat"],
  // TypeScript / Next.js / .NET were evidenced only by POWWR stack detail that
  // is no longer published. Left unmapped rather than claimed without visible
  // proof — the site's own rule is that a counted chip must light up its work.
  TypeScript: ["proj-fog-prediction-pipeline-mlops"],
  FastAPI: ["exp-sparkix-technologies"],
  Flask: ["exp-sparkix-technologies", "exp-grayhat"],
};

/** Community roles held alongside the BSc (source: LinkedIn volunteering). */
export const volunteering = [
  {
    role: "Developer",
    org: "FAST Blockchain Society",
    dates: "Nov 2022 – May 2024",
    detail: "Built and maintained the society's projects across a year and a half.",
  },
  {
    role: "Sponsorship Coordinator",
    org: "FAST Computing Society",
    dates: "Nov 2022 – May 2024",
    detail: "Secured and managed sponsor relationships for society events.",
  },
] as const;

export type Certificate = {
  name: string;
  issuer: string;
  date: string;
  /** Grouping used by the certificate chart's legend. */
  track: "Agentic AI" | "Core GenAI" | "Cloud & MLOps";
};

/** All 15 certificates from the master CV, newest first. */
export const certificates: Certificate[] = [
  { name: "Claude Code: A Highly Agentic Coding Assistant", issuer: "DeepLearning.AI", date: "Feb 2026", track: "Agentic AI" },
  { name: "Evaluating AI Agents", issuer: "DeepLearning.AI", date: "Jan 2026", track: "Agentic AI" },
  { name: "MCP: Build Rich-Context AI Apps with Anthropic", issuer: "DeepLearning.AI", date: "Feb 2026", track: "Agentic AI" },
  { name: "AI Agentic Design Patterns with AutoGen", issuer: "DeepLearning.AI", date: "Jan 2026", track: "Agentic AI" },
  { name: "Pretraining LLM", issuer: "DeepLearning.AI", date: "Jan 2026", track: "Core GenAI" },
  { name: "Prompt Compression and Query Optimization", issuer: "DeepLearning.AI", date: "Jan 2026", track: "Core GenAI" },
  { name: "Agentic AI", issuer: "DeepLearning.AI", date: "Dec 2025", track: "Agentic AI" },
  { name: "Building Agentic RAG with LlamaIndex", issuer: "DeepLearning.AI", date: "Dec 2025", track: "Agentic AI" },
  { name: "Building AI Voice Agents for Production", issuer: "DeepLearning.AI", date: "Jan 2025", track: "Agentic AI" },
  { name: "Building Live Voice Agents with Google's ADK", issuer: "DeepLearning.AI", date: "Dec 2024", track: "Agentic AI" },
  { name: "Vector Databases: From Embeddings to Applications", issuer: "DeepLearning.AI", date: "Aug 2024", track: "Core GenAI" },
  { name: "LangChain for LLM Application Development", issuer: "DeepLearning.AI", date: "Jul 2024", track: "Core GenAI" },
  { name: "Preprocessing Unstructured Data for LLM Applications", issuer: "DeepLearning.AI", date: "Jun 2024", track: "Core GenAI" },
  { name: "Open Source Models with Hugging Face", issuer: "DeepLearning.AI", date: "May 2024", track: "Cloud & MLOps" },
  { name: "AWS Academy: Microservices & CI/CD Pipeline Builder", issuer: "AWS", date: "Apr 2024", track: "Cloud & MLOps" },
  { name: "Generative AI with Large Language Models", issuer: "Coursera", date: "Nov 2023", track: "Core GenAI" },
];

/**
 * Repos hidden from the auto-built GitHub grid: profile README, the old
 * portfolio, university coursework and training-internship assignments.
 * Forks are excluded automatically in lib/github.ts.
 */
export const repoDenylist = new Set([
  // Flagship case studies already have their own cards above the grid.
  "omni-channel-ai-assistant",
  "llm-judge-recruitment-agent",
  "local-pii-redaction-pipeline",
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
