"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { identity } from "@/content/profile";
import { services } from "@/content/services";

const ENDPOINT = "https://zahid-enquiries.zaahidimraan.workers.dev";

type Status = { kind: "idle" | "sending" | "sent" | "error"; message?: string };

const FIELD =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm transition-colors focus:border-foreground focus:outline-none";

export function EnquiryForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // Bots submit instantly; the server rejects anything faster than a few
  // seconds. Stamped after mount — calling Date.now() while rendering is
  // impure and makes the component non-deterministic.
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "sending") return;
    setStatus({ kind: "sending" });

    const data = new FormData(event.currentTarget);
    const payload = {
      name: data.get("name"),
      email: data.get("email"),
      company: data.get("company"),
      budget: data.get("budget"),
      service: data.get("service"),
      message: data.get("message"),
      website: data.get("website"), // honeypot
      elapsed: (Date.now() - openedAt.current) / 1000,
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { ok: boolean; message?: string; error?: string };
      if (body.ok) {
        setStatus({ kind: "sent", message: body.message });
      } else {
        setStatus({ kind: "error", message: body.error ?? "Something went wrong." });
      }
    } catch {
      setStatus({
        kind: "error",
        message: `Couldn't reach the server. Please email ${identity.email} directly.`,
      });
    }
  }

  if (status.kind === "sent") {
    return (
      <div
        role="status"
        className="rounded-lg border border-foreground/60 bg-card p-8 text-center"
      >
        <p className="text-lg font-semibold">Message received</p>
        <p className="mt-2 text-sm text-muted">
          {status.message} In the meantime, everything I&apos;ve built is on{" "}
          <Link href="/" className="u-link text-foreground">
            the homepage
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wider text-muted">Name *</span>
          <input name="name" required autoComplete="name" className={FIELD} />
        </label>
        <label className="grid gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wider text-muted">Email *</span>
          <input name="email" type="email" required autoComplete="email" className={FIELD} />
        </label>
        <label className="grid gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wider text-muted">Company</span>
          <input name="company" autoComplete="organization" className={FIELD} />
        </label>
        <label className="grid gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wider text-muted">
            Rough budget
          </span>
          <select name="budget" className={FIELD} defaultValue="">
            <option value="">Prefer not to say</option>
            <option>Under £5k</option>
            <option>£5k – £15k</option>
            <option>£15k – £50k</option>
            <option>£50k+</option>
            <option>Day rate / ongoing</option>
          </select>
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">
          What do you need?
        </span>
        <select name="service" className={FIELD} defaultValue="">
          <option value="">Not sure yet</option>
          {services.map((s) => (
            <option key={s.title}>{s.title}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">
          About the project *
        </span>
        <textarea
          name="message"
          required
          rows={6}
          minLength={20}
          placeholder="What are you building, what's in the way, and what would a good outcome look like?"
          className={`${FIELD} resize-y`}
        />
      </label>

      {/* Honeypot — off-screen, not display:none, so bots still fill it. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status.kind === "sending"}
          className="glow-hover-sm rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {status.kind === "sending" ? "Sending…" : "Send enquiry"}
        </button>
        <span className="text-xs text-muted">
          or email{" "}
          <a href={`mailto:${identity.email}`} className="u-link text-foreground">
            {identity.email}
          </a>
        </span>
      </div>

      {status.kind === "error" && (
        <p role="alert" className="text-sm text-foreground">
          ⚠ {status.message}
        </p>
      )}

      <p className="text-xs leading-relaxed text-muted">
        Your details are stored only so I can reply. No newsletter, no third-party
        analytics, nothing passed on.
      </p>
    </form>
  );
}
