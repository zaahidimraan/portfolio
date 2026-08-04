/**
 * The one mutable fact block on the site (INT-3).
 * Updated conversationally via the portfolio MCP server (`set_status`)
 * or the daily /career-run pipeline — never invent content here.
 */
export const status = {
  focus: "Building document-AI and agentic pipelines as an AI Engineer at POWWR",
  availability: "Open to AI engineering roles & collaborations",
  updated: "2026-07-31",
} as const;
