<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Publication rules — read before writing any site copy

This site is public. Zahid works at POWWR, and the strongest remaining material
comes from POWWR internal systems. Published raw it is a confidentiality breach
and makes him a *riskier* hire, not a better one — hiring managers notice a
candidate who leaks their employer's architecture.

**Never publish:** internal repo, service, cluster, registry or namespace names ·
Jira keys · Confluence page titles or URLs · architecture-decision numbers ·
names of colleagues, customers, suppliers or partners · any vendor named as
being replaced, underperforming or costed · absolute costs, licence fees or
contract values · verbatim or near-verbatim internal text · screenshots of
internal tools.

**Safe to publish:** employer name and role title · the *shape* of a system
(pattern names, architecture style, why one design beat an alternative) ·
generic domain nouns ("supplier pricing documents", "utility bills",
"authorisation letters") · relative and normalised metrics (percentages, ratios,
latency, tokens per document) · public product names (Azure OpenAI, Docling,
Dagster, Playwright, Claude) · outcomes framed as business effect.

**Every POWWR sentence must pass both tests:**
1. It still makes sense to a reader who has never heard of POWWR.
2. No POWWR engineer reading it could point to a specific internal artefact.

Fails either → generalise it.

**Numbers derived from POWWR data need explicit sign-off** before they ship, and
the same rules apply to the MCP server payload in `public-mcp/` — it is exactly
as public as the page.

Full backlog and status: `../05-backlog/portfolio-site.md`.
