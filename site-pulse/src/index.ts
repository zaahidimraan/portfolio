/**
 * site-pulse — aggregate-only analytics for zahid-imran.pages.dev (E51).
 *
 * POST /a       beacon deltas from the site's Pulse component
 * GET  /summary last-30-day aggregates, public JSON (feeds the ask-zahid
 *               MCP server's site_analytics tool)
 *
 * Privacy is the design: one KV value per day holding counters only —
 * views, engaged seconds, per-section seconds, referrer host counts.
 * No IP, user agent, cookie, or identifier is ever read into storage.
 */

/* Minimal KV surface this Worker uses — keeps the file self-contained
   without pulling @cloudflare/workers-types into the site's toolchain
   (the dir is excluded from the site tsconfig; wrangler bundles it). */
type KVListResult = { keys: { name: string }[] };
interface PulseKV {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  list(opts?: { prefix?: string }): Promise<KVListResult>;
}

export interface Env {
  PULSE: PulseKV;
}

const SITE_ORIGIN = "https://zahid-imran.pages.dev";

type Day = {
  v: number;
  e: number;
  s: Record<string, number>;
  r: Record<string, number>;
  /** Guided-tour funnel: starts / completes. */
  t?: { s: number; c: number };
};

type BeaconBody = {
  p?: string;
  r?: string;
  e?: number;
  s?: Record<string, number>;
  v?: number;
  tour?: "start" | "complete";
};

const dayKey = () => `d:${new Date().toISOString().slice(0, 10)}`;

const clampInt = (n: unknown, max: number) =>
  Math.max(0, Math.min(Math.floor(typeof n === "number" && Number.isFinite(n) ? n : 0), max));

const cleanId = (s: string) => /^[a-z0-9-]{1,24}$/.test(s);

async function ingest(request: Request, env: Env): Promise<Response> {
  if (request.headers.get("Origin") !== SITE_ORIGIN) {
    return new Response(null, { status: 403 });
  }
  const raw = await request.text();
  if (raw.length > 2048) return new Response(null, { status: 413 });
  let b: BeaconBody;
  try {
    b = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }

  const key = dayKey();
  const cur = ((await env.PULSE.get(key, "json")) as Day | null) ?? { v: 0, e: 0, s: {}, r: {} };

  if (b.tour === "start" || b.tour === "complete") {
    cur.t = cur.t ?? { s: 0, c: 0 };
    if (b.tour === "start") cur.t.s += 1;
    else cur.t.c += 1;
    await env.PULSE.put(key, JSON.stringify(cur), { expirationTtl: 60 * 60 * 24 * 400 });
    return new Response(null, { status: 204 });
  }

  cur.v += clampInt(b.v, 1);
  cur.e += clampInt(b.e, 3600);
  const sections = b.s && typeof b.s === "object" ? Object.entries(b.s).slice(0, 12) : [];
  for (const [id, sec] of sections) {
    if (!cleanId(id)) continue;
    cur.s[id] = (cur.s[id] ?? 0) + clampInt(sec, 3600);
  }
  if (b.v === 1 && typeof b.r === "string" && b.r && b.r.length <= 80) {
    const host = b.r.toLowerCase().replace(/[^a-z0-9.-]/g, "").slice(0, 80);
    if (host && Object.keys(cur.r).length < 200) cur.r[host] = (cur.r[host] ?? 0) + 1;
  }

  await env.PULSE.put(key, JSON.stringify(cur), { expirationTtl: 60 * 60 * 24 * 400 });
  return new Response(null, { status: 204 });
}

async function summary(env: Env): Promise<Response> {
  const list = await env.PULSE.list({ prefix: "d:" });
  const keys = list.keys
    .map((k: { name: string }) => k.name)
    .sort()
    .slice(-30);
  const days: { date: string; views: number; engagedSec: number }[] = [];
  const totals = { views: 0, engagedSec: 0 };
  const tour = { starts: 0, completes: 0 };
  const sections: Record<string, number> = {};
  const referrers: Record<string, number> = {};

  for (const key of keys) {
    const d = (await env.PULSE.get(key, "json")) as Day | null;
    if (!d) continue;
    days.push({ date: key.slice(2), views: d.v, engagedSec: d.e });
    totals.views += d.v;
    totals.engagedSec += d.e;
    for (const [id, s] of Object.entries(d.s)) sections[id] = (sections[id] ?? 0) + s;
    for (const [h, n] of Object.entries(d.r)) referrers[h] = (referrers[h] ?? 0) + n;
    if (d.t) {
      tour.starts += d.t.s;
      tour.completes += d.t.c;
    }
  }

  const body = {
    site: SITE_ORIGIN,
    windowDays: days.length,
    totals: {
      ...totals,
      avgEngagedSecPerView: totals.views ? Math.round(totals.engagedSec / totals.views) : 0,
    },
    days,
    tour,
    sectionSeconds: Object.fromEntries(Object.entries(sections).sort((a, b) => b[1] - a[1])),
    topReferrers: Object.fromEntries(
      Object.entries(referrers).sort((a, b) => b[1] - a[1]).slice(0, 10),
    ),
    privacy: "Aggregate counters only — no IPs, user agents, cookies or identifiers are stored.",
  };
  return Response.json(body, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": SITE_ORIGIN,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    if (request.method === "POST" && url.pathname === "/a") return ingest(request, env);
    if (request.method === "GET" && url.pathname === "/summary") return summary(env);
    if (request.method === "GET") {
      return new Response(
        "site-pulse — aggregate-only analytics for zahid-imran.pages.dev. GET /summary for the public numbers.",
        { headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
    }
    return new Response("Method not allowed", { status: 405 });
  },
};
