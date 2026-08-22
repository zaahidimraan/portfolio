"use client";

import { useEffect, useRef, useState } from "react";
import type { House3DHandle } from "./engine";

/**
 * The 3D house shell, v2 (E50): Zahid's one-storey House3D dock + stage per
 * his SYNC.md handoff. Three.js and the engine still load lazily when the
 * section approaches the viewport, so the main bundle and LCP stay untouched.
 *
 * Truthfulness: the NOW card shows the schedule the scene actually runs, the
 * site section the current room stands for (his section→room map), and the
 * real last GitHub push; the footer names what feeds it.
 */

type Props = {
  lastPush: { name: string; at: string } | null;
};

type Status = "idle" | "loading" | "ready" | "unsupported";

const ROOM_BUTTONS: [string, string][] = [
  ["office", "Office"], ["server", "Server"],
  ["bedroom", "Bedroom"], ["bath", "Bathroom"],
  ["drawing", "Drawing rm"], ["kitchen", "Kitchen"],
  ["library", "Library"], ["garage", "Workshop"],
  ["balcony", "Balcony"], ["hall", "Corridor"],
];

export function House3D({ lastPush }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [pushDays, setPushDays] = useState<number | null>(null);

  useEffect(() => {
    if (!lastPush) return;
    const t = setTimeout(() => {
      setPushDays(Math.max(0, Math.round((Date.now() - new Date(lastPush.at).getTime()) / 86_400_000)));
    }, 0);
    return () => clearTimeout(t);
  }, [lastPush]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let handle: House3DHandle | null = null;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setStatus("loading");
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const now = new Date();
        import("./engine").then(({ initHouse3D }) => {
          if (cancelled || !rootRef.current || !stageRef.current) return;
          handle = initHouse3D(rootRef.current, stageRef.current, {
            startHour: now.getHours() + now.getMinutes() / 60,
            reduced,
            onDayNight: (day) => {
              // The page theme keeps following the scene's sun; a pinned
              // toggle choice always wins (E35, unchanged).
              if (localStorage.getItem("theme")) return;
              document.documentElement.classList.toggle("dark", !day);
            },
          });
          setStatus(handle ? "ready" : "unsupported");
        });
      },
      { rootMargin: "600px" },
    );
    io.observe(root);
    return () => {
      cancelled = true;
      io.disconnect();
      handle?.dispose();
    };
  }, []);

  return (
    <div ref={rootRef} className="h3d" data-status={status}>
      <aside className="h3d-dock">
        <div>
          <p className="h3d-name">Zahid Imran</p>
          <p className="h3d-lbl">AI ENGINEER · AGENTIC SYSTEMS, RAG, MCP</p>
        </div>

        <div className="h3d-card h3d-now">
          <div className="h3d-row">
            <span className="h3d-lbl h3d-lbl-dark">NOW</span>
            <span className="h3d-clock" data-h3d="clock">--:--</span>
          </div>
          <div className="h3d-nowroom" data-h3d="nowRoom">…</div>
          <div className="h3d-nowact" data-h3d="nowAct">waking the house up</div>
          <div className="h3d-push" data-h3d="nowSec">→ section office</div>
          {lastPush && pushDays !== null && (
            <div className="h3d-push">
              pushed to /{lastPush.name} · {pushDays === 0 ? "today" : `${pushDays}d ago`}
            </div>
          )}
          <div className="h3d-src">github · daily schedule</div>
        </div>

        <div>
          <div className="h3d-row" style={{ marginBottom: 6 }}>
            <span className="h3d-lbl">DAY</span>
            <button type="button" className="h3d-play" data-h3d="play">❙❙ pause time</button>
          </div>
          <input type="range" min={0} max={23.99} step={0.01} defaultValue={14.2} data-h3d="timeSlider" aria-label="Scrub the scene clock" />
          <div className="h3d-sched" data-h3d="sched" />
        </div>

        <div>
          <div className="h3d-lbl" style={{ marginBottom: 5 }}>WALLS</div>
          <div className="h3d-seg">
            <button type="button" data-wall="line">line</button>
            <button type="button" data-wall="low">low</button>
            <button type="button" data-wall="cutaway">cutaway</button>
            <button type="button" data-wall="full">full</button>
          </div>
        </div>

        <div>
          <div className="h3d-lbl" style={{ marginBottom: 5 }}>LIGHT</div>
          <div className="h3d-seg">
            <button type="button" data-light="soft" data-k="0.8">soft</button>
            <button type="button" data-light="studio" data-k="1">studio</button>
            <button type="button" data-light="bright" data-k="1.35">bright</button>
          </div>
        </div>

        <div>
          <div className="h3d-lbl" style={{ marginBottom: 5 }}>PALETTE</div>
          <div className="h3d-seg">
            <button type="button" data-pal="clay">clay</button>
            <button type="button" data-pal="nord">nord</button>
            <button type="button" data-pal="dusk">dusk</button>
          </div>
        </div>

        <div>
          <div className="h3d-row" style={{ marginBottom: 5 }}>
            <span className="h3d-lbl">DAY LENGTH</span>
            <span className="h3d-lbl h3d-lbl-dark" data-h3d="dayLenVal">190 s / day</span>
          </div>
          <input type="range" min={40} max={600} step={10} defaultValue={190} data-h3d="dayLen" aria-label="Seconds per scene day" />
        </div>

        <div>
          <div className="h3d-lbl" style={{ marginBottom: 5 }}>SHOW</div>
          <div className="h3d-seg">
            <button type="button" data-h3d="togChar">character</button>
            <button type="button" data-h3d="togGarden">garden</button>
            <button type="button" data-h3d="togOrbit">auto-orbit</button>
          </div>
        </div>

        <div>
          <div className="h3d-lbl" style={{ marginBottom: 5 }}>ROOMS</div>
          <div className="h3d-rooms">
            {ROOM_BUTTONS.map(([key, label]) => (
              <button key={key} type="button" data-room={key}>{label}</button>
            ))}
          </div>
        </div>

        <p className="h3d-help">
          one storey · walls are floor lines by default · drag = orbit · right-drag / two-finger = pan · wheel / pinch = zoom · click a room to zoom, again to step inside · esc = overview
        </p>
      </aside>

      <div ref={stageRef} className="h3d-stage">
        <div className="h3d-chip" data-h3d="chip">
          <div className="h3d-chip-txt">
            <div className="h3d-chip-name" data-h3d="chipName">Office</div>
            <div className="h3d-chip-act" data-h3d="chipAct" />
            <a className="h3d-chip-sec" data-h3d="chipSec" href="#office">open office ↗</a>
          </div>
          <button type="button" data-h3d="walkBtn">walk here</button>
          <button type="button" data-h3d="closeChip">← out</button>
        </div>
        <div className="h3d-viewbtns">
          <button type="button" data-h3d="insideBtn">step inside</button>
          <button type="button" data-h3d="reset">reset view</button>
        </div>
        <p className="h3d-hint">a day in the house — the character keeps my schedule, the light keeps the clock</p>
        {status !== "ready" && (
          <div className="h3d-loading">
            {status === "unsupported" ? (
              <>
                <p className="h3d-loading-big">this browser sat out the 3D house</p>
                <p className="h3d-loading-sub">WebGL is unavailable — the career timeline below still tells the story</p>
              </>
            ) : (
              <>
                <p className="h3d-loading-big">building the house…</p>
                <p className="h3d-loading-sub">walls, furniture, one small resident</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
