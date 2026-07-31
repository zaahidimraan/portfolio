#!/usr/bin/env node
/**
 * Portfolio MCP server (INT-5) — talk to the portfolio from any MCP client:
 *   get_status / set_status  — read or rewrite src/content/status.ts
 *   deploy_portfolio         — build + wrangler pages deploy (≈60–90 s)
 *   site_health              — live checks against the deployed site
 *
 * stdio transport; register via .mcp.json:
 *   { "mcpServers": { "portfolio": { "command": "node",
 *     "args": ["D:/Projects/portfolio/mcp-server/server.mjs"] } } }
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATUS_FILE = join(REPO_ROOT, "src", "content", "status.ts");
const SITE_URL = "https://zahid-imran.pages.dev";
const PAGES_PROJECT = "zahid-imran";

function readStatus() {
  const source = readFileSync(STATUS_FILE, "utf8");
  const grab = (key) => {
    const match = source.match(new RegExp(`${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    if (!match) throw new Error(`status.ts: could not parse "${key}"`);
    return JSON.parse(`"${match[1]}"`);
  };
  return { focus: grab("focus"), availability: grab("availability"), updated: grab("updated") };
}

function writeStatus({ focus, availability }) {
  const updated = new Date().toISOString().slice(0, 10);
  const file = `/**
 * The one mutable fact block on the site (INT-3).
 * Updated conversationally via the portfolio MCP server (\`set_status\`)
 * or the daily /career-run pipeline — never invent content here.
 */
export const status = {
  focus: ${JSON.stringify(focus)},
  availability: ${JSON.stringify(availability)},
  updated: ${JSON.stringify(updated)},
} as const;
`;
  writeFileSync(STATUS_FILE, file, "utf8");
  return { focus, availability, updated };
}

const server = new McpServer({ name: "portfolio", version: "1.0.0" });

server.registerTool(
  "get_status",
  {
    description: "Read the portfolio's current Now/status block (focus, availability, updated).",
    inputSchema: {},
  },
  async () => ({
    content: [{ type: "text", text: JSON.stringify(readStatus(), null, 2) }],
  }),
);

server.registerTool(
  "set_status",
  {
    description:
      "Update the portfolio's Now/status block. Omitted fields keep their current value; " +
      "the updated date is stamped automatically. Run deploy_portfolio afterwards to publish.",
    inputSchema: {
      focus: z.string().min(1).max(200).optional().describe("Current focus line"),
      availability: z.string().min(1).max(200).optional().describe("Availability line"),
    },
  },
  async ({ focus, availability }) => {
    if (!focus && !availability) {
      throw new Error("Provide focus and/or availability — nothing to update.");
    }
    const current = readStatus();
    const next = writeStatus({
      focus: focus ?? current.focus,
      availability: availability ?? current.availability,
    });
    return {
      content: [
        {
          type: "text",
          text: `status.ts updated:\n${JSON.stringify(next, null, 2)}\n\nNot yet live — call deploy_portfolio to publish.`,
        },
      ],
    };
  },
);

server.registerTool(
  "deploy_portfolio",
  {
    description:
      "Build the site (npm run build) and deploy out/ to Cloudflare Pages. " +
      "Takes ~60–90 seconds; returns the deployment URL. Requires wrangler to be authenticated.",
    inputSchema: {},
  },
  async () => {
    const build = execSync("npm run build", {
      cwd: REPO_ROOT,
      encoding: "utf8",
      timeout: 240_000,
    });
    if (!build.includes("Generating static pages")) {
      throw new Error(`Build output unexpected — inspect manually:\n${build.slice(-800)}`);
    }
    const deploy = execSync(
      `npx wrangler pages deploy out --project-name=${PAGES_PROJECT} --branch=master --commit-dirty=true`,
      { cwd: REPO_ROOT, encoding: "utf8", timeout: 240_000 },
    );
    const url = deploy.match(/https:\/\/\S+\.pages\.dev/)?.[0] ?? "(url not found in output)";
    return {
      content: [
        {
          type: "text",
          text: `Deployed. Preview: ${url}\nProduction: ${SITE_URL}\n\n${deploy.trim().split("\n").slice(-3).join("\n")}`,
        },
      ],
    };
  },
);

server.registerTool(
  "site_health",
  {
    description:
      "Check the live site: homepage, OG image content-type, CV PDF, robots.txt, and 404 behaviour.",
    inputSchema: {},
  },
  async () => {
    const checks = [
      { path: "/", expect: 200 },
      { path: "/opengraph-image", expect: 200, contentType: "image/png" },
      { path: "/Zahid-Imran-CV.pdf", expect: 200, contentType: "application/pdf" },
      { path: "/robots.txt", expect: 200 },
      { path: "/this-page-does-not-exist", expect: 404 },
    ];
    const results = [];
    for (const check of checks) {
      const res = await fetch(SITE_URL + check.path, { redirect: "follow" });
      const type = res.headers.get("content-type") ?? "";
      const statusOk = res.status === check.expect;
      const typeOk = !check.contentType || type.startsWith(check.contentType);
      results.push(
        `${statusOk && typeOk ? "PASS" : "FAIL"} ${check.path} → ${res.status} ${type}`,
      );
    }
    const healthy = results.every((r) => r.startsWith("PASS"));
    return {
      content: [
        { type: "text", text: `${healthy ? "HEALTHY" : "UNHEALTHY"}\n${results.join("\n")}` },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
