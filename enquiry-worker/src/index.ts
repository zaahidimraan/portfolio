/**
 * Enquiry intake for the portfolio's /services page.
 *
 * Static sites cannot receive a POST, so the form submits here. Submissions are
 * stored in D1 and read back through the portfolio MCP server (`get_enquiries`),
 * so Zahid can triage them from a Claude session.
 *
 * Deliberately no third-party form service and no email provider: both would
 * need an account and an API key, and neither is required to receive a message
 * reliably. The page also shows his email address, so a sender is never blocked
 * by this endpoint being down.
 *
 * Spam handling is layered and cheap: a honeypot field bots fill and humans
 * cannot see, a minimum time-on-form check, size limits, and a per-IP rate
 * limit backed by the same database.
 */

interface Env {
  DB: D1Database;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const LIMITS = {
  name: 120,
  email: 200,
  company: 160,
  budget: 60,
  service: 80,
  message: 4000,
  /** Bots submit instantly; a human takes longer than this to fill the form. */
  minSecondsOnForm: 3,
  /** Per-IP submissions allowed in the trailing window. */
  maxPerHour: 5,
};

type Payload = Record<string, unknown>;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS });
}

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Deliberately permissive: rejecting unusual but valid addresses is worse than accepting a bad one. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (request.method === "GET") {
      return new Response(
        "Enquiry endpoint for zahid-imran.pages.dev/services — POST only.\n" +
          "Submissions are stored privately and are not readable from here.\n",
        { headers: { "Content-Type": "text/plain; charset=utf-8", ...CORS } },
      );
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    let payload: Payload;
    try {
      payload = (await request.json()) as Payload;
    } catch {
      return json({ ok: false, error: "Malformed request." }, 400);
    }

    // Honeypot: a field positioned off-screen that no human ever fills.
    // Answer 200 so bots see success and do not retry with variations.
    if (str(payload.website, 200)) {
      return json({ ok: true, message: "Thanks — message received." });
    }

    const elapsed = Number(payload.elapsed);
    if (!Number.isFinite(elapsed) || elapsed < LIMITS.minSecondsOnForm) {
      return json({ ok: false, error: "That was submitted a little too fast — please try again." }, 400);
    }

    const name = str(payload.name, LIMITS.name);
    const email = str(payload.email, LIMITS.email);
    const message = str(payload.message, LIMITS.message);
    const company = str(payload.company, LIMITS.company);
    const budget = str(payload.budget, LIMITS.budget);
    const service = str(payload.service, LIMITS.service);

    if (!name || !email || !message) {
      return json({ ok: false, error: "Name, email and message are all required." }, 400);
    }
    if (!looksLikeEmail(email)) {
      return json({ ok: false, error: "That email address doesn't look right." }, 400);
    }
    if (message.length < 20) {
      return json({ ok: false, error: "Please add a little more detail about the work." }, 400);
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    try {
      const recent = await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM enquiries WHERE source_ip = ? AND created_at > ?",
      )
        .bind(ip, hourAgo)
        .first<{ n: number }>();

      if ((recent?.n ?? 0) >= LIMITS.maxPerHour) {
        return json(
          { ok: false, error: "You've sent several messages already — please email directly instead." },
          429,
        );
      }

      await env.DB.prepare(
        `INSERT INTO enquiries (created_at, name, email, company, budget, service, message, source_ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(now.toISOString(), name, email, company, budget, service, message, ip)
        .run();
    } catch (error) {
      console.error("enquiry insert failed", error);
      return json(
        { ok: false, error: "Something went wrong saving that. Please email zaahidimraan@gmail.com." },
        500,
      );
    }

    return json({ ok: true, message: "Thanks — message received. I'll reply within a couple of days." });
  },
};
