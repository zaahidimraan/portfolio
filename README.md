# zahid.imran — portfolio

Personal portfolio site for Zahid Imran (AI Engineer, Manchester UK).

- **Stack:** Next.js (static export) · TypeScript · Tailwind v4
- **Content rule:** every fact mirrors the master CV in Career HQ (`D:\Projects\Career\00-master-cv`). All personal data lives in [`src/content/profile.ts`](src/content/profile.ts) — edit there only.
- **GitHub grid** is fetched from the public GitHub API at build time (forks + coursework denylisted in `profile.ts`). The build **fails loudly** if the fetch fails.
- **CV download:** `npm run build` copies the master CV PDF into `public/` via `scripts/sync-cv.mjs` (falls back to the committed copy when Career HQ isn't present, e.g. CI).

## Commands

```bash
npm run dev    # local dev
npm run build  # static export to out/
```

Serve the export locally: `python -m http.server 4173 --directory out`

Deploy (wrangler must be authenticated once via `npx wrangler login`):

```bash
npx wrangler pages deploy out --project-name=zahid-imran
```

## MCP server

[`mcp-server/server.mjs`](mcp-server/server.mjs) lets any MCP client (e.g. Claude Code)
drive the portfolio conversationally. Registered in Career HQ's `.mcp.json`.

| Tool | What it does |
|---|---|
| `get_status` | Read the hero "Now" block (`src/content/status.ts`) |
| `set_status` | Update focus/availability; stamps the date automatically |
| `deploy_portfolio` | `npm run build` + wrangler deploy (≈60–90 s) |
| `site_health` | Live checks: `/`, OG image type, CV PDF, robots, 404 |

Typical flow: *"set my status to X"* → `set_status` → `deploy_portfolio` → live.

## Backlog

Tickets and roadmap live in Career HQ: `D:\Projects\Career\05-backlog\portfolio-site.md`.
