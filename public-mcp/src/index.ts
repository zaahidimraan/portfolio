/**
 * Public "Ask about Zahid" MCP server.
 *
 * A remote Model Context Protocol endpoint anyone can connect to (Claude,
 * Cursor, any MCP client) to ask about Zahid Imran's experience, projects and
 * skills. Stateless JSON-RPC over HTTP POST — no auth, no cookies, no storage.
 *
 * Every answer is drawn from PROFILE below, which mirrors the master CV. The
 * server never invents facts: unknown queries return an explicit "not in the
 * profile" response rather than a guess.
 */

import { PROFILE, SITE_URL } from "./profile";

export interface Env {
  /** Service binding to the site-pulse Worker (aggregate analytics). */
  PULSE_SVC: Fetcher;
}

const PROTOCOL_VERSION = "2024-11-05";

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>, env: Env) => string | Promise<string>;
};

const noArgs = { type: "object", properties: {} } as const;

function text(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

/** Case-insensitive substring match across a record's serialized values. */
function matches(haystack: unknown, needle: string): boolean {
  return JSON.stringify(haystack).toLowerCase().includes(needle.toLowerCase());
}

const TOOLS: ToolDefinition[] = [
  {
    name: "get_profile",
    description:
      "Zahid Imran's headline profile: current role, location, summary, contact links, work authorisation and availability. Start here.",
    inputSchema: noArgs,
    handler: () => text(PROFILE.identity),
  },
  {
    name: "get_experience",
    description:
      "Full work history — every role with company, dates and the quantified achievements from his CV.",
    inputSchema: noArgs,
    handler: () => text(PROFILE.experience),
  },
  {
    name: "get_projects",
    description:
      "Engineering projects: three flagship AI systems plus further work, each with the outcome, how it was built, and the tech used.",
    inputSchema: {
      type: "object",
      properties: {
        flagship_only: {
          type: "boolean",
          description: "Return only the three flagship projects (default false).",
        },
      },
    },
    handler: (args) =>
      text(
        args.flagship_only
          ? PROFILE.projects.filter((p) => p.flagship)
          : PROFILE.projects,
      ),
  },
  {
    name: "get_skills",
    description:
      "Technical skills grouped by category (agentic orchestration, GenAI & LLMs, evaluation & ops, data & vector engineering, core development).",
    inputSchema: noArgs,
    handler: () => text(PROFILE.skills),
  },
  {
    name: "get_education",
    description: "Degrees, institutions, grades and relevant modules.",
    inputSchema: noArgs,
    handler: () => text(PROFILE.education),
  },
  {
    name: "get_certifications",
    description: "All 15 professional certificates with issuer, date and subject track.",
    inputSchema: noArgs,
    handler: () => text(PROFILE.certificates),
  },
  {
    name: "get_metrics",
    description:
      "Headline measured results from production systems and projects — the numbers a hiring manager asks about.",
    inputSchema: noArgs,
    handler: () => text(PROFILE.metrics),
  },
  {
    name: "search_profile",
    description:
      "Free-text search across every section (experience, projects, skills, certificates, education). Use this for questions like 'has he used Kubernetes?' or 'what has he done with RAG?'.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keyword or technology to look for." },
      },
      required: ["query"],
    },
    handler: (args) => {
      const query = String(args.query ?? "").trim();
      if (!query) return "Provide a non-empty query.";
      const hits: Record<string, readonly unknown[]> = {};
      const sections: Record<string, readonly unknown[]> = {
        experience: PROFILE.experience,
        projects: PROFILE.projects,
        certificates: PROFILE.certificates,
        education: PROFILE.education,
        volunteering: PROFILE.volunteering,
        metrics: PROFILE.metrics,
      };
      for (const [section, entries] of Object.entries(sections)) {
        // A query naming the section itself ("volunteering") should return the
        // whole section, not nothing.
        const wholeSection = section.toLowerCase().includes(query.toLowerCase());
        const found = wholeSection ? entries : entries.filter((entry) => matches(entry, query));
        if (found.length) hits[section] = found;
      }
      const skillHits = PROFILE.skills
        .flatMap((group) => group.items.map((item) => ({ group: group.label, skill: item })))
        .filter((entry) => matches(entry, query));
      if (skillHits.length) hits.skills = skillHits;

      if (!Object.keys(hits).length) {
        return `No mention of "${query}" in Zahid's profile. This profile mirrors his CV exactly — if it isn't here, he hasn't claimed it. Ask him directly at ${PROFILE.identity.email}.`;
      }
      return text(hits);
    },
  },
  {
    name: "get_cv",
    description:
      "Direct link to Zahid's CV (PDF) and his portfolio, GitHub, and LinkedIn — for when someone wants the source documents.",
    inputSchema: noArgs,
    handler: () =>
      text({
        cv_pdf: `${SITE_URL}/Zahid-Imran-CV.pdf`,
        portfolio: SITE_URL,
        github: PROFILE.identity.github,
        linkedin: PROFILE.identity.linkedin,
        email: PROFILE.identity.email,
      }),
  },
  {
    name: "site_overview",
    description:
      "How Zahid's portfolio website looks and what to explore on it — every section with its direct link, including the interactive 3D house. Use this to guide someone around the site.",
    inputSchema: noArgs,
    handler: () =>
      text({
        url: SITE_URL,
        what_it_is:
          "A monochrome editorial single-page portfolio. Section 02 is an interactive Three.js house: a character lives a daily schedule inside it, rooms map to the site's sections, and you can orbit, change wall rendering, palette and lighting.",
        preview_image: `${SITE_URL}/opengraph-image`,
        sections: [
          { id: "01 impact", url: `${SITE_URL}/#impact`, shows: "measured results with links to proof" },
          { id: "02 the house", url: `${SITE_URL}/#office`, shows: "the interactive 3D house (drag to orbit, click rooms)" },
          { id: "03 projects", url: `${SITE_URL}/#projects`, shows: "three flagship AI systems + further work and live GitHub data" },
          { id: "04 experience", url: `${SITE_URL}/#experience`, shows: "work history; the POWWR entry links the employer's public team spotlight" },
          { id: "05 skills", url: `${SITE_URL}/#skills`, shows: "skills matrix — every skill links to where it was used" },
          { id: "06 certificates", url: `${SITE_URL}/#certificates`, shows: "15 certificates across three tracks" },
          { id: "07 ask my portfolio", url: `${SITE_URL}/#mcp`, shows: "this MCP server, documented on the page" },
          { id: "08 contact", url: `${SITE_URL}/services`, shows: "services, engagement modes and contact" },
        ],
        cv_pdf: `${SITE_URL}/Zahid-Imran-CV.pdf`,
        tip: "Open the URL in a browser to see it; site_analytics reports how visitors actually engage.",
      }),
  },
  {
    name: "site_analytics",
    description:
      "Live aggregate engagement for the portfolio site: views, time spent, per-section attention and top referrers over the last 30 days. Aggregate-only by design — no visitor identifiers exist.",
    inputSchema: noArgs,
    handler: async (_args, env) => {
      try {
        const res = await env.PULSE_SVC.fetch("https://site-pulse.zaahidimraan.workers.dev/summary");
        if (!res.ok) return `Analytics endpoint returned ${res.status}.`;
        return text(await res.json());
      } catch {
        return "Analytics endpoint unreachable right now — try again shortly.";
      }
    },
  },
];

function result(id: JsonRpcRequest["id"], value: unknown) {
  return { jsonrpc: "2.0", id, result: value };
}

function handleRpc(request: JsonRpcRequest, env: Env) {
  const { method, id, params = {} } = request;

  switch (method) {
    case "initialize":
      return result(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "ask-about-zahid", version: "1.1.0" },
        instructions:
          "Answer questions about Zahid Imran, an AI Engineer in Manchester UK, using these tools. " +
          "Every fact mirrors his CV — never embellish beyond what the tools return. " +
          "Use search_profile for specific technology questions.",
      });

    case "notifications/initialized":
      return null; // notification: no response

    case "tools/list":
      return result(id, {
        tools: TOOLS.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        })),
      });

    case "tools/call": {
      const name = String((params as { name?: string }).name ?? "");
      const args = ((params as { arguments?: Record<string, unknown> }).arguments ??
        {}) as Record<string, unknown>;
      const tool = TOOLS.find((t) => t.name === name);
      if (!tool) {
        return result(id, {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        });
      }
      return Promise.resolve()
        .then(() => tool.handler(args, env))
        .then((value) => result(id, { content: [{ type: "text", text: value }] }))
        .catch((error: Error) =>
          result(id, {
            content: [{ type: "text", text: `Tool failed: ${error.message}` }],
            isError: true,
          }),
        );
    }

    case "ping":
      return result(id, {});

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, MCP-Protocol-Version",
};

/** Human-readable landing page — the endpoint is also a URL people will paste into a browser. */
function landingPage(): Response {
  const body = `Ask-about-Zahid — public MCP server

Connect any MCP client to this URL to ask about Zahid Imran's work:

  ${PROFILE.identity.mcpUrl}

Claude Code:  claude mcp add --transport http zahid ${PROFILE.identity.mcpUrl}
Claude.ai:    Settings -> Connectors -> Add custom connector -> paste the URL

Tools: ${TOOLS.map((t) => t.name).join(", ")}

Everything returned mirrors his CV. Portfolio: ${SITE_URL}
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", ...CORS },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method === "GET") return landingPage();
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: CORS });
    }

    let payload: JsonRpcRequest | JsonRpcRequest[];
    try {
      payload = await request.json();
    } catch {
      return Response.json(
        { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
        { headers: CORS },
      );
    }

    const batch = Array.isArray(payload) ? payload : [payload];
    const responses = (await Promise.all(batch.map((r) => handleRpc(r, env)))).filter(
      (r) => r !== null,
    );
    if (!responses.length) return new Response(null, { status: 202, headers: CORS });

    return Response.json(Array.isArray(payload) ? responses : responses[0], {
      headers: CORS,
    });
  },
};
