"use client";

import { useEffect } from "react";

/**
 * Self-hosted visit pulse (E51): answers "do people spend time on the site,
 * and where" without a third-party tracker.
 *
 * What it sends (to the site-pulse Worker, aggregate storage only):
 *   p  path · r referrer hostname (external only) · e engaged seconds since
 *   the last send · s per-section visible seconds since the last send ·
 *   v 1 on the first send of a page view, else 0
 *
 * What it deliberately does NOT do: no cookies, no localStorage, no user or
 * session identifiers, nothing when Do Not Track is on, and engagement only
 * counts while the tab is actually visible. Sends are DELTAS so the Worker
 * can blindly add them; the footer's privacy line describes this honestly.
 */

const ENDPOINT = "https://site-pulse.zaahidimraan.workers.dev/a";

export function Pulse() {
  useEffect(() => {
    if (navigator.doNotTrack === "1") return;

    const now = () => performance.now();
    let visStart: number | null = document.visibilityState === "visible" ? now() : null;
    let engagedMs = 0;
    let sentView = false;

    const secTimes: Record<string, number> = {};
    let active: string | null = null;
    let secStart = now();
    const closeSection = () => {
      if (active && visStart !== null) {
        secTimes[active] = (secTimes[active] ?? 0) + (now() - secStart);
      }
      secStart = now();
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            closeSection();
            active = (e.target as HTMLElement).id;
          } else if ((e.target as HTMLElement).id === active) {
            closeSection();
            active = null;
          }
        }
      },
      { threshold: [0.4] },
    );
    document.querySelectorAll("section[id]").forEach((s) => io.observe(s));

    const send = () => {
      closeSection();
      if (visStart !== null) {
        engagedMs += now() - visStart;
        visStart = document.visibilityState === "visible" ? now() : null;
      }
      const sections: Record<string, number> = {};
      for (const [k, v] of Object.entries(secTimes)) {
        const s = Math.round(v / 1000);
        if (s > 0) sections[k] = Math.min(s, 3600);
        delete secTimes[k];
      }
      const e = Math.min(Math.round(engagedMs / 1000), 3600);
      engagedMs = 0;
      if (!sentView && e === 0 && Object.keys(sections).length === 0) return;
      let r = "";
      try {
        const h = document.referrer ? new URL(document.referrer).hostname : "";
        if (h && h !== location.hostname) r = h;
      } catch {
        /* malformed referrer — skip it */
      }
      const body = JSON.stringify({ p: location.pathname, r, e, s: sections, v: sentView ? 0 : 1 });
      sentView = true;
      navigator.sendBeacon?.(ENDPOINT, body);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        send();
      } else {
        visStart = now();
        secStart = now();
      }
    };

    // First ping after a few seconds so short visits still count as views.
    const first = setTimeout(send, 6000);
    document.addEventListener("visibilitychange", onVisibility);
    addEventListener("pagehide", send);
    return () => {
      clearTimeout(first);
      document.removeEventListener("visibilitychange", onVisibility);
      removeEventListener("pagehide", send);
      io.disconnect();
    };
  }, []);

  return null;
}
