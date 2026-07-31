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

## Backlog

Tickets and roadmap live in Career HQ: `D:\Projects\Career\05-backlog\portfolio-site.md`.
