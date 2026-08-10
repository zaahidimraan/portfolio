"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CommitHistory, Repo } from "@/lib/github";
import { Avatar } from "./avatar";
import { Garden, Labels, SceneView } from "./scene";
import { UPPER_H, makeProj, type Rot } from "./iso";
import {
  DAY_REAL_MS, NODES, ROOMS, ROOM_BY_KEY, SCHEDULE, SUNRISE_MIN, SUNSET_MIN,
  roomBBox, stateAt, type RoomKey,
} from "./plan";

/**
 * The living isometric house (E38–E44, from Zahid's own Claude Design
 * wireframes + BUILD-SPEC.md).
 *
 * The avatar lives a real daily schedule compressed into six minutes; the
 * scene's sun drives the page theme (a pinned toggle choice always wins);
 * rooms zoom in on click; the dock carries the NOW card and the day timeline.
 * All per-frame motion goes through refs — React state changes only when the
 * room, the zoom or the intro stage changes.
 */

type HouseProps = {
  repos: Pick<Repo, "name" | "createdAt" | "pushedAt" | "description">[];
  commits: CommitHistory | null;
  /** Key of the month being celebrated below, or null — triggers confetti. */
  burst: string | null;
};

type IntroStage = "dark" | "walls" | "furnish" | "enter" | "done";

const SCENE_MIN_PER_MS = 1440 / DAY_REAL_MS;

/** Dock rows for the day timeline, in display order. */
const DAY_ROWS = SCHEDULE.filter((s) => s.min > 0);

const fmt = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(Math.floor(min % 60)).padStart(2, "0")}`;

const roomWord: Record<RoomKey, string> = {
  bedroom: "bedroom", bath: "bathroom", kitchen: "kitchen", office: "office",
  server: "server nook", drawing: "drawing room", library: "library",
  garage: "workshop", hall: "hall", balcony: "balcony",
};

const HOTSPOTS: { room: RoomKey; u: number; v: number; h: number; href: string; label: string }[] = [
  { room: "office", u: 30, v: 1.4, h: UPPER_H + 6, href: "#projects", label: "the monitors — projects" },
  { room: "library", u: 35.5, v: 1.8, h: 10, href: "#certificates", label: "the shelf — certificates" },
  { room: "garage", u: 2, v: 20, h: 5.5, href: "#skills", label: "the bench — skills" },
  { room: "balcony", u: 35, v: 20.5, h: 4, href: "/services", label: "the balcony — say hello" },
];

export function House({ repos, commits, burst }: HouseProps) {
  const [now, setNow] = useState<{ room: RoomKey; doing: string } | null>(null);
  const [zoom, setZoom] = useState<RoomKey | null>(null);
  const [hoverRoom, setHoverRoom] = useState<RoomKey | null>(null);
  const [intro, setIntro] = useState<IntroStage | null>(null);
  const [pushDays, setPushDays] = useState<number | null>(null);
  const [rot, setRot] = useState<Rot>(0);
  const [zoomF, setZoomF] = useState(1);
  const p = useMemo(() => makeProj(rot), [rot]);

  const svgRef = useRef<SVGSVGElement>(null);
  const avRef = useRef<SVGGElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const sunRef = useRef<SVGGElement>(null);
  const moonRef = useRef<SVGGElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const scrubRef = useRef<HTMLInputElement>(null);
  /** Set by the loop effect; the scrubber calls it to jump the scene clock. */
  const clockCtl = useRef<((minute: number) => void) | null>(null);
  const nowRef = useRef<string>("");
  const introRef = useRef<IntroStage | null>(null);
  useEffect(() => {
    introRef.current = intro;
  }, [intro]);
  const rotRef = useRef<Rot>(0);
  useEffect(() => {
    rotRef.current = rot;
  }, [rot]);
  /** Repaints the avatar/sun for the current minute — used on rotation. */
  const repaintRef = useRef<(() => void) | null>(null);
  const lastXRef = useRef<number | null>(null);
  const facingRef = useRef<1 | -1>(1);

  /* -------- what the CRT and NOW card can say truthfully -------- */
  const lastPush = useMemo(() => {
    if (!repos.length) return null;
    const r = [...repos].sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))[0];
    return { name: r.name, at: new Date(r.pushedAt) };
  }, [repos]);

  const liveUnits = useMemo(() => {
    if (!commits) return repos.slice(0, 3).map((r) => r.name);
    const months = Object.keys(commits.months).sort();
    const latest = months[months.length - 1];
    return Object.entries(commits.byRepo)
      .filter(([, byMonth]) => (byMonth[latest] ?? 0) > 0)
      .sort((a, b) => (b[1][latest] ?? 0) - (a[1][latest] ?? 0))
      .map(([name]) => name);
  }, [commits, repos]);

  /* -------- intro (E43): five beats, once per visitor -------- */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = localStorage.getItem("houseIntroSeen") === "1";
    } catch { /* private mode */ }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const finish = () => {
      timers.forEach(clearTimeout);
      setIntro("done");
      try { localStorage.setItem("houseIntroSeen", "1"); } catch { /* ignore */ }
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("keydown", finish);
    };
    if (reduced || seen) {
      timers.push(setTimeout(() => setIntro("done"), 0));
      return () => timers.forEach(clearTimeout);
    }
    timers.push(setTimeout(() => setIntro("dark"), 0));
    timers.push(setTimeout(() => setIntro("walls"), 1200));
    timers.push(setTimeout(() => setIntro("furnish"), 3000));
    timers.push(setTimeout(() => setIntro("enter"), 4400));
    timers.push(setTimeout(finish, 6800));
    window.addEventListener("pointerdown", finish);
    window.addEventListener("keydown", finish);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("keydown", finish);
    };
  }, []);

  /* -------- the scene loop (E39/E40) -------- */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const applyTheme = (dark: boolean) => {
      // A pinned toggle choice always beats the sun.
      if (localStorage.getItem("theme")) return;
      document.documentElement.classList.toggle("dark", dark);
    };

    const place = (minute: number, gateNight: boolean) => {
      const st = stateAt(minute);
      const pr = makeProj(rotRef.current);
      const [x, y] = pr(st.u, st.v, st.h);
      // Facing comes from SCREEN direction so he never moonwalks, whatever
      // the camera angle (E48).
      if (st.pose === "walk" && lastXRef.current !== null) {
        const dx = x - lastXRef.current;
        if (Math.abs(dx) > 0.3) facingRef.current = dx >= 0 ? 1 : -1;
      }
      lastXRef.current = x;
      const av = avRef.current;
      if (av) {
        av.setAttribute("transform", `translate(${x} ${y})`);
        av.setAttribute("data-pose", st.pose);
        av.setAttribute("data-facing", String(st.pose === "walk" ? facingRef.current : st.facing));
      }
      glowRef.current?.setAttribute("transform", `translate(${x} ${y - 10})`);

      const m = Math.floor(minute);
      const isDay = !gateNight && m >= SUNRISE_MIN && m < SUNSET_MIN;
      svgRef.current?.setAttribute("data-day", String(isDay));
      if (!gateNight) applyTheme(!isDay);

      // sun 07→19, moon 19→07, both on the same arc over the roof
      const sunFrac = (m - SUNRISE_MIN) / (SUNSET_MIN - SUNRISE_MIN);
      const moonFrac = (((m - SUNSET_MIN) + 1440) % 1440) / 720;
      const arc = (f: number) => `translate(${-360 + 920 * f} ${-176 - 66 * Math.sin(Math.PI * Math.min(Math.max(f, 0), 1))})`;
      sunRef.current?.setAttribute("transform", arc(sunFrac));
      moonRef.current?.setAttribute("transform", arc(moonFrac));

      if (clockRef.current) clockRef.current.textContent = fmt(m);
      if (markerRef.current) markerRef.current.style.top = `${(m / 1440) * 100}%`;
      const sl = scrubRef.current;
      if (sl && document.activeElement !== sl) sl.value = String(m);

      const key = `${st.room}|${st.doing}`;
      if (key !== nowRef.current) {
        nowRef.current = key;
        setNow({ room: st.room, doing: st.doing });
      }
    };

    const d = new Date();
    // sessionStorage.houseClock pins the scene clock to a minute of day —
    // used by scripts/scenes-house.mjs to capture day/night deterministically.
    const forced = Number(sessionStorage.getItem("houseClock"));
    const startMin = Number.isFinite(forced) && sessionStorage.getItem("houseClock") !== null
      ? forced
      : d.getHours() * 60 + d.getMinutes();

    if (reduced) {
      // Static scene at the real current hour; theme by the real clock. The
      // deferred call keeps the setState out of the synchronous effect body.
      // The scrubber still works — it just repositions the static scene.
      let cur = startMin;
      clockCtl.current = (m) => {
        cur = m;
        place(m, false);
      };
      repaintRef.current = () => place(cur, false);
      const t = setTimeout(() => place(startMin, false), 0);
      return () => {
        clearTimeout(t);
        clockCtl.current = null;
        repaintRef.current = null;
      };
    }

    let acc = startMin;
    let last = performance.now();
    let raf = 0;
    // Dragging the day scrubber jumps the clock; the day keeps running from
    // wherever it lands.
    clockCtl.current = (m) => {
      acc = m;
    };
    repaintRef.current = () => {
      const stage = introRef.current;
      place(acc, stage !== null && stage !== "done" && stage !== "enter");
    };
    const tick = (t: number) => {
      // Clamping the delta pauses scene time while the tab is hidden.
      const dt = Math.min(t - last, 120);
      last = t;
      acc = (acc + dt * SCENE_MIN_PER_MS) % 1440;
      const stage = introRef.current;
      place(acc, stage !== null && stage !== "done" && stage !== "enter");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clockCtl.current = null;
      repaintRef.current = null;
    };
  }, []);

  /* -------- orbit (E48): reproject the living layer on turn -------- */
  useEffect(() => {
    lastXRef.current = null;
    const t = setTimeout(() => repaintRef.current?.(), 0);
    return () => clearTimeout(t);
  }, [rot]);

  /* -------- zoom (E41) -------- */
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  const camera = useMemo(() => {
    if (zoom) {
      const b = roomBBox(ROOM_BY_KEY[zoom], p);
      const s = Math.min(3.4, Math.max(1.7, Math.min(860 / b.w, 500 / b.h)));
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      return `translate(${95 - s * cx}px, ${30 - s * cy}px) scale(${s})`;
    }
    return `translate(${95 * (1 - zoomF)}px, ${40 * (1 - zoomF)}px) scale(${zoomF})`;
  }, [zoom, zoomF, p]);

  const toggleRoom = (key: RoomKey) => setZoom((z) => (z === key ? null : key));
  const orbit = (dir: 1 | -1) => setRot((r) => (((r + dir + 4) % 4) as Rot));

  /* -------- drag sideways on the scene to orbit (E48) -------- */
  const dragRef = useRef<{ x: number; done: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, done: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.done) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 55) {
      d.done = true;
      orbit(dx > 0 ? -1 : 1);
    }
  };
  const onPointerUp = () => {
    // A drag that rotated must not fall through as a click-to-unzoom.
    const rotated = dragRef.current?.done ?? false;
    setTimeout(() => {
      dragRef.current = null;
    }, 0);
    return rotated;
  };

  // "N days ago" needs the real clock, so it resolves on the client only.
  useEffect(() => {
    if (!lastPush) return;
    const t = setTimeout(() => {
      setPushDays(Math.max(0, Math.round((Date.now() - lastPush.at.getTime()) / 86_400_000)));
    }, 0);
    return () => clearTimeout(t);
  }, [lastPush]);

  const nowLabel = now ? roomWord[now.room] : "…";

  return (
    <div className="house" data-intro={intro ?? "dark"} data-zoom={zoom ? "in" : "out"}>
      {/* beat 1: dark + name */}
      <div className="house-cover" aria-hidden>
        <p>Zahid Imran</p>
        <span>skip ↵</span>
      </div>

      <div className="house-dock">
        <p className="house-dock-name">
          Zahid Imran
          <span>AI engineer</span>
        </p>

        <div className="house-now" aria-live="polite">
          <p className="house-now-head">
            <span>NOW</span>
            <span ref={clockRef}>--:--</span>
          </p>
          <p className="house-now-body">
            ◍ in the {nowLabel}
            <br />· {now?.doing ?? "loading the day"}
            {lastPush && pushDays !== null && (
              <>
                <br />· pushed to /{lastPush.name} · {pushDays === 0 ? "today" : `${pushDays}d ago`}
              </>
            )}
            {liveUnits.length > 0 && (
              <>
                <br />· {liveUnits.length} project{liveUnits.length === 1 ? "" : "s"} on the rack
              </>
            )}
          </p>
          <p className="house-now-src">github · daily schedule</p>
        </div>

        <div className="house-day">
          <div className="house-sunbar">
            <span ref={markerRef} />
          </div>
          <ul>
            {DAY_ROWS.map((row) => {
              const room = NODES[row.spot].room;
              const active = now?.room === room && now?.doing === row.doing;
              return (
                <li key={`${row.min}-${row.spot}`}>
                  <button
                    type="button"
                    className={active ? "is-now" : undefined}
                    onClick={() => setZoom(room)}
                  >
                    {fmt(row.min)} {roomWord[room]}
                    {active && " ●"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <label className="house-scrub">
          <span>drag his day</span>
          <input
            ref={scrubRef}
            type="range"
            min={0}
            max={1439}
            step={1}
            defaultValue={720}
            aria-label="Scrub the day — the character moves to that time"
            onChange={(e) => clockCtl.current?.(Number(e.currentTarget.value))}
            onPointerUp={(e) => e.currentTarget.blur()}
          />
        </label>

        <p className="house-dock-note">
          {zoom
            ? "esc or click outside to step back"
            : "click a room to step inside · drag sideways to orbit · hover to name it"}
        </p>
      </div>

      <div className="house-stage">
        <svg
          ref={svgRef}
          viewBox="-410 -270 1010 620"
          className="house-svg"
          data-day="true"
          role="img"
          aria-label="An isometric cutaway of Zahid's house — he moves between rooms on his real daily schedule; drag sideways to orbit"
          onClick={() => {
            if (!dragRef.current?.done) setZoom(null);
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <defs>
            <linearGradient id="hs-sky-day" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a9c08b" />
              <stop offset="1" stopColor="#ddd6ab" />
            </linearGradient>
            <linearGradient id="hs-sky-night" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0f1626" />
              <stop offset="1" stopColor="#232c47" />
            </linearGradient>
            <radialGradient id="hs-glow-warm">
              <stop offset="0" stopColor="#ffd98a" stopOpacity="0.75" />
              <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hs-glow-cold">
              <stop offset="0" stopColor="#7fb8ff" stopOpacity="0.6" />
              <stop offset="1" stopColor="#7fb8ff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* sky stays fixed while the camera zooms the house */}
          <g aria-hidden>
            <rect x="-410" y="-270" width="1010" height="620" fill="url(#hs-sky-day)" />
            <rect className="hs-sky-night" x="-410" y="-270" width="1010" height="620" fill="url(#hs-sky-night)" />
            <g className="hs-stars">
              {[[-330, -230], [-180, -250], [-60, -215], [40, -245], [150, -225], [260, -250], [370, -220], [480, -240], [540, -190], [-260, -160], [520, -120]].map(([x, y]) => (
                <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" fill="#dfe6f2" />
              ))}
            </g>
            <g className="hs-clouds">
              <g><ellipse cx="-250" cy="-205" rx="46" ry="14" fill="#fff" /><ellipse cx="-222" cy="-199" rx="30" ry="11" fill="#fff" /></g>
              <g><ellipse cx="160" cy="-238" rx="46" ry="14" fill="#fff" /><ellipse cx="188" cy="-232" rx="30" ry="11" fill="#fff" /></g>
              <g><ellipse cx="300" cy="-200" rx="46" ry="14" fill="#fff" /><ellipse cx="328" cy="-194" rx="30" ry="11" fill="#fff" /></g>
            </g>
            <g ref={sunRef} className="hs-sun">
              <circle r="24" fill="#f6c14e" />
              <circle r="32" fill="none" stroke="#f6c14e" strokeOpacity="0.4" strokeWidth="3" />
            </g>
            <g ref={moonRef} className="hs-moon">
              <circle r="16" fill="#dfe6f2" />
              <circle cx="-5" cy="-3" r="3.5" fill="#c3cde0" />
              <circle cx="5" cy="6" r="2.4" fill="#c3cde0" />
            </g>
          </g>

          <g className="hs-camera" style={{ transform: camera }}>
            <g aria-hidden>
              <Garden />
            </g>
            <g className="hs-world" key={rot}>
            <g aria-hidden>
              <SceneView rot={rot} />
            </g>

            {/* night falls over the scene, then the lights punch through it */}
            <rect className="hs-night" x="-410" y="-270" width="1010" height="620" fill="#141b2e" aria-hidden />
            <g className="hs-glows" aria-hidden>
              <circle ref={glowRef} className="hs-glow-warm" r="52" fill="url(#hs-glow-warm)" />
              <circle
                className="hs-glow-cold"
                cx={p(37, 2.2, UPPER_H + 3.5)[0]}
                cy={p(37, 2.2, UPPER_H + 3.5)[1]}
                r="42"
                fill="url(#hs-glow-cold)"
              />
            </g>

            {/* the CRT keeps a truthful little status readout (E41) */}
            <g className="hs-crt-text" aria-hidden>
              {[
                `> ${now?.doing ?? "booting"}`,
                `> room: ${nowLabel}`,
                lastPush ? `> push: ${lastPush.name.slice(0, 12)}` : "> push: —",
                `> units: ${liveUnits.length} live`,
              ].map((t, i) => (
                <text key={i} x={p(36.15, 7.84, UPPER_H + 4.15 - i * 0.62)[0]} y={p(36.15, 7.84, UPPER_H + 4.15 - i * 0.62)[1]} fontSize="2.4" fill="#58d08a" fontFamily="ui-monospace,monospace">
                  {t}
                </text>
              ))}
            </g>

            {/* Zahid, billboarded over the iso floor */}
            <g ref={avRef} className="house-avatar" aria-hidden>
              <Avatar />
            </g>

            {/* celebration confetti for the months timeline below (E36) */}
            {burst && (
              <g key={burst} className="fx-confetti" aria-hidden>
                {[...Array(12)].map((_, i) => {
                  const a = (i / 12) * Math.PI * 2;
                  const [cx, cy] = [54, -60];
                  return (
                    <line
                      key={i}
                      x1={cx + 20 * Math.cos(a)}
                      y1={cy + 20 * Math.sin(a)}
                      x2={cx + 52 * Math.cos(a)}
                      y2={cy + 52 * Math.sin(a)}
                      stroke={["#c94f43", "#f2c14e", "#6aa9e0", "#6c945a"][i % 4]}
                      strokeWidth="2.6"
                      style={{ animationDelay: `${(i % 6) * 0.05}s` }}
                    />
                  );
                })}
              </g>
            )}

            <Labels show={hoverRoom} rot={rot} />

            {/* invisible room hit areas — the accessible way in (E44) */}
            <g className="hs-hit">
              {ROOMS.filter((r) => r.key !== "hall").map((r) => {
                const hit = [p(r.u1, r.v1, r.h), p(r.u2, r.v1, r.h), p(r.u2, r.v2, r.h), p(r.u1, r.v2, r.h)]
                  .map(([x, y]) => `${x},${y}`)
                  .join(" ");
                const active = now?.room === r.key;
                return (
                  <polygon
                    key={r.key}
                    points={hit}
                    role="button"
                    tabIndex={0}
                    aria-label={`${r.label.toLowerCase()}${active && now ? ` — currently ${now.doing}` : ""}${zoom === r.key ? " — press to step back" : " — press to step inside"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRoom(r.key);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleRoom(r.key);
                      }
                    }}
                    onMouseEnter={() => setHoverRoom(r.key)}
                    onMouseLeave={() => setHoverRoom(null)}
                    onFocus={() => setHoverRoom(r.key)}
                    onBlur={() => setHoverRoom(null)}
                  />
                );
              })}
            </g>

            {/* hotspots appear inside a zoomed room */}
            <g className="hs-spots">
              {HOTSPOTS.filter((s) => s.room === zoom).map((s) => {
                const [x, y] = p(s.u, s.v, s.h);
                return (
                  <a key={s.href} href={s.href} className="hs-spot" aria-label={s.label} onClick={(e) => e.stopPropagation()}>
                    <circle cx={x} cy={y} r="7" fill="#1a1a1a" fillOpacity="0.55" />
                    <path d={`M${x} ${y - 4} L${x + 4} ${y} L${x} ${y + 4} L${x - 4} ${y} Z`} fill="#f2c14e" />
                    <title>{s.label}</title>
                  </a>
                );
              })}
            </g>
            </g>
          </g>
        </svg>

        {/* orbit + zoom (E48) */}
        <div className="house-ctl" role="group" aria-label="Camera controls">
          <button type="button" onClick={() => orbit(-1)} aria-label="Rotate the house left">⟲</button>
          <button type="button" onClick={() => orbit(1)} aria-label="Rotate the house right">⟳</button>
          <button type="button" onClick={() => setZoomF((f) => Math.max(0.7, Math.round(f / 1.25 * 100) / 100))} aria-label="Zoom out">−</button>
          <button type="button" onClick={() => setZoomF((f) => Math.min(2.4, Math.round(f * 1.25 * 100) / 100))} aria-label="Zoom in">+</button>
        </div>

        {zoom && (
          <button type="button" className="house-back" onClick={() => setZoom(null)}>
            ← back to the house
          </button>
        )}
      </div>
    </div>
  );
}
