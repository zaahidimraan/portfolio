"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { certificates, education, experience, volunteering } from "@/content/profile";
import type { CommitHistory, Repo } from "@/lib/github";

/**
 * The living home (E34–E37).
 *
 * A top-down plan of Zahid's home — bedroom, kitchen, drawing room, office —
 * where he lives a compressed 24-hour routine on his own: asleep at night, in
 * the kitchen at sunrise, at the desk through the day, in the drawing room in
 * the evening. The page's theme follows the scene's sun by default (the
 * toggle can pin it). The month timeline underneath answers *what* was
 * running — with a ▶ button that plays the whole career automatically and
 * celebrates the months where something new began. The server rack still
 * zooms in for inspection.
 *
 * The walker is driven imperatively through refs at requestAnimationFrame
 * rate; React state only changes once per in-scene minute, so the page is not
 * re-rendered 60 times a second for one moving figure.
 */

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthIndex(label: string): number | null {
  const [mon, year] = label.trim().split(/\s+/);
  const m = MONTHS[mon];
  const y = Number(year);
  if (m === undefined || Number.isNaN(y)) return null;
  return y * 12 + m;
}

function isoToIndex(iso: string): number {
  const [y, m] = iso.slice(0, 7).split("-").map(Number);
  return y * 12 + (m - 1);
}

function indexToLabel(idx: number): string {
  return `${MONTH_NAMES[idx % 12]} ${Math.floor(idx / 12)}`;
}

type Span = {
  start: number;
  end: number | null;
  head: string;
  sub: string;
  detail: string[];
};
type Point = { at: number; head: string; sub: string };

function parseSpan(dates: string, head: string, sub: string, detail: string[]): Span | null {
  const [from, to] = dates.split("–").map((part) => part.trim());
  const start = monthIndex(from);
  if (start === null) return null;
  const end = to === "Present" ? null : monthIndex(to ?? "");
  return { start, end, head, sub, detail };
}

type Unit = { id: string; label: string; detail: string };

/* ---------------- the daily routine ---------------- */

type P = { x: number; y: number };

// Standing spots and door gaps in the plan (viewBox 640×300).
const SPOT = {
  bed: { x: 94, y: 80 },
  kitchen: { x: 500, y: 100 },
  desk: { x: 470, y: 234 },
  sofa: { x: 105, y: 214 },
  doorT: { x: 320, y: 90 },
  doorL: { x: 170, y: 150 },
  doorR: { x: 470, y: 150 },
  doorB: { x: 320, y: 215 },
} as const;

// One day, as phase fractions. Stations sit still; walks follow door paths.
const DAY: Array<
  | { until: number; at: P; pose: "sleep" | "stand" }
  | { until: number; path: P[] }
> = [
  { until: 0.28, at: SPOT.bed, pose: "sleep" },
  { until: 0.315, path: [SPOT.bed, SPOT.doorT, SPOT.kitchen] },
  { until: 0.4, at: SPOT.kitchen, pose: "stand" },
  { until: 0.43, path: [SPOT.kitchen, SPOT.doorR, SPOT.desk] },
  { until: 0.7, at: SPOT.desk, pose: "stand" },
  { until: 0.73, path: [SPOT.desk, SPOT.doorR, SPOT.kitchen] },
  { until: 0.79, at: SPOT.kitchen, pose: "stand" },
  { until: 0.835, path: [SPOT.kitchen, SPOT.doorR, SPOT.doorB, SPOT.sofa] },
  { until: 0.93, at: SPOT.sofa, pose: "stand" },
  { until: 0.965, path: [SPOT.sofa, SPOT.doorL, SPOT.bed] },
  { until: 1.0, at: SPOT.bed, pose: "sleep" },
];

const SUNRISE = 0.29;
const SUNSET = 0.79;
const DAY_MS = 120_000; // the whole 24h in two minutes

function poseAt(phase: number): { x: number; y: number; angle: number; walking: boolean; sleeping: boolean } {
  let from = 0;
  for (const seg of DAY) {
    if (phase < seg.until) {
      if ("at" in seg) {
        return { x: seg.at.x, y: seg.at.y, angle: 0, walking: false, sleeping: seg.pose === "sleep" };
      }
      const t = (phase - from) / (seg.until - from);
      const legs = seg.path.length - 1;
      const leg = Math.min(Math.floor(t * legs), legs - 1);
      const lt = t * legs - leg;
      const a = seg.path[leg];
      const b = seg.path[leg + 1];
      const x = a.x + (b.x - a.x) * lt;
      const y = a.y + (b.y - a.y) * lt;
      const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90;
      return { x, y, angle, walking: true, sleeping: false };
    }
    from = seg.until;
  }
  return { x: SPOT.bed.x, y: SPOT.bed.y, angle: 0, walking: false, sleeping: true };
}

const line = { stroke: "currentColor", fill: "none", strokeLinecap: "round" as const };

export function Office({
  repos,
  commits,
}: {
  repos: Pick<Repo, "name" | "createdAt" | "pushedAt" | "description">[];
  commits: CommitHistory | null;
}) {
  const model = useMemo(() => {
    const work = experience
      .map((r) => parseSpan(r.dates, r.title, r.company, r.bullets.slice(0, 2)))
      .filter((s): s is Span => s !== null);
    const study = education
      .map((e) => parseSpan(e.dates, e.degree, e.school, e.detail ? [e.detail] : []))
      .filter((s): s is Span => s !== null);
    const volunteer = volunteering
      .map((v) => parseSpan(v.dates, v.role, v.org, v.detail ? [v.detail] : []))
      .filter((s): s is Span => s !== null);
    const certs = certificates
      .map((c): Point | null => {
        const at = monthIndex(c.date);
        return at === null ? null : { at, head: c.name, sub: c.issuer };
      })
      .filter((p): p is Point => p !== null);
    const repoSpans = repos.map((r) => ({
      name: r.name,
      start: isoToIndex(r.createdAt),
      end: isoToIndex(r.pushedAt),
      description: r.description,
    }));
    const starts = [
      ...work.map((s) => s.start),
      ...study.map((s) => s.start),
      ...repoSpans.map((r) => r.start),
    ];
    const ends = [
      ...work.map((s) => s.end ?? 0),
      ...study.map((s) => s.end ?? 0),
      ...repoSpans.map((r) => r.end),
      ...certs.map((c) => c.at),
    ];
    return {
      work, study, volunteer, certs, repoSpans,
      min: Math.min(...starts),
      max: Math.max(...ends),
    };
  }, [repos]);

  const total = model.max - model.min + 1;
  const [pos, setPos] = useState(total - 1);
  const [zoomed, setZoomed] = useState(false);
  const [inspected, setInspected] = useState<Unit | null>(null);
  const [playing, setPlaying] = useState(false);

  const idx = model.min + pos;
  const inSpan = (s: { start: number; end: number | null }) =>
    idx >= s.start && idx <= (s.end ?? model.max);

  const working = model.work.filter(inSpan);
  const studying = model.study.filter(inSpan);
  const volunteeringNow = model.volunteer.filter(inSpan);
  const earned = model.certs.filter((c) => c.at === idx);

  const monthKey = `${String(Math.floor(idx / 12)).padStart(4, "0")}-${String((idx % 12) + 1).padStart(2, "0")}`;
  const building = commits
    ? Object.entries(commits.byRepo)
        .filter(([, byMonth]) => (byMonth[monthKey] ?? 0) > 0)
        .map(([name, byMonth]) => ({
          name,
          n: byMonth[monthKey],
          description: model.repoSpans.find((r) => r.name === name)?.description ?? null,
        }))
        .sort((a, b) => b.n - a.n)
    : model.repoSpans
        .filter(inSpan)
        .map((r) => ({ name: r.name, n: 0, description: r.description }));

  // The celebration list: everything that BEGAN this month.
  const startedNow = [
    ...model.work.filter((w) => w.start === idx).map((w) => `Joined ${w.sub.split("·")[0].trim()} — ${w.head}`),
    ...model.study.filter((s) => s.start === idx).map((s) => `Started ${s.head}`),
    ...earned.map((c) => `Earned ${c.head}`),
  ];
  const hasNew = (at: number) =>
    model.work.some((w) => w.start === at) ||
    model.study.some((s) => s.start === at) ||
    model.certs.some((c) => c.at === at);

  const units: Unit[] = [
    ...working.map((w) => ({
      id: `role-${w.sub}`,
      label: w.sub.split("·")[0].trim().slice(0, 14),
      detail: `${w.head} · ${w.sub}`,
    })),
    ...building.map((b) => ({
      id: `repo-${b.name}`,
      label: b.name.slice(0, 14),
      detail: b.n > 0 ? `${b.name} — ${b.n} commit${b.n === 1 ? "" : "s"} this month` : `${b.name} — active this month`,
    })),
  ].slice(0, 6);

  const jump = (months: number) => setPos((p) => Math.min(Math.max(p + months, 0), total - 1));

  /* -------- auto-play through the career (E36) -------- */
  useEffect(() => {
    if (!playing) return;
    // Dwell longer on months where something begins, so the celebration lands.
    const dwell = hasNew(model.min + pos) ? 1400 : 300;
    // Both state writes happen in the timer callback, never synchronously in
    // the effect body — a synchronous write here would cascade a re-render.
    const t = setTimeout(() => {
      if (pos >= total - 1) setPlaying(false);
      else setPos(pos + 1);
    }, dwell);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, pos, total]);

  /* -------- the day loop: walker, clock, sun, theme (E34/E35) -------- */
  const figRef = useRef<SVGGElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const clockRef = useRef<SVGTextElement>(null);
  const lastMinute = useRef(-1);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const applyTheme = (dark: boolean) => {
      // A pinned choice always wins over the sun.
      if (localStorage.getItem("theme")) return;
      document.documentElement.classList.toggle("dark", dark);
    };

    if (reduced) {
      // No loop: figure at the desk, theme by the visitor's real clock.
      const now = new Date();
      const h = now.getHours();
      applyTheme(h < 7 || h >= 19);
      figRef.current?.setAttribute("transform", `translate(${SPOT.desk.x} ${SPOT.desk.y})`);
      svgRef.current?.setAttribute("data-day", String(h >= 7 && h < 19));
      svgRef.current?.setAttribute("data-sleeping", "false");
      if (clockRef.current) {
        clockRef.current.textContent =
          `${String(h).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      }
      return;
    }

    // The scene's day starts at the visitor's real time of day, then runs fast.
    const now = new Date();
    const startPhase = (now.getHours() * 60 + now.getMinutes()) / 1440;
    const t0 = performance.now() - startPhase * DAY_MS;
    let raf = 0;

    const tick = (t: number) => {
      const phase = ((t - t0) % DAY_MS) / DAY_MS;
      const pose = poseAt(phase);
      const fig = figRef.current;
      if (fig) {
        fig.setAttribute("transform", `translate(${pose.x} ${pose.y}) rotate(${pose.angle})`);
        fig.setAttribute("data-walking", String(pose.walking));
        fig.setAttribute("data-sleeping", String(pose.sleeping));
      }
      // The zzz belongs to *sleeping*, not to night — he is awake in the
      // evening, and floating z's over an empty bed looked like a bug.
      svgRef.current?.setAttribute("data-sleeping", String(pose.sleeping));
      const minute = Math.floor(phase * 1440);
      if (minute !== lastMinute.current) {
        lastMinute.current = minute;
        const hh = String(Math.floor(minute / 60)).padStart(2, "0");
        const mm = String(minute % 60).padStart(2, "0");
        if (clockRef.current) clockRef.current.textContent = `${hh}:${mm}`;
        const isDay = phase >= SUNRISE && phase < SUNSET;
        svgRef.current?.setAttribute("data-day", String(isDay));
        applyTheme(!isDay);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* -------- the camera (rack zoom, kept from E30) -------- */
  const ZOOM = 2.5;
  const RACK = { cx: 580, cy: 221 };
  const sceneTransform = zoomed
    ? `matrix(${ZOOM}, 0, 0, ${ZOOM}, ${320 - ZOOM * RACK.cx}, ${150 - ZOOM * RACK.cy})`
    : "matrix(1, 0, 0, 1, 0, 0)";

  return (
    <div className="office">
      <svg
        ref={svgRef}
        viewBox="0 0 640 306"
        className="office-svg home-svg"
        data-day="true"
        data-sleeping="false"
        aria-hidden
        focusable="false"
      >
        <g className="home-scene" style={{ transform: sceneTransform }}>
          {/* outer walls */}
          <rect x="24" y="20" width="592" height="260" rx="3" strokeWidth="2.5" {...line} />
          {/* interior walls with door gaps */}
          <line x1="320" y1="20" x2="320" y2="70" strokeWidth="1.8" {...line} />
          <line x1="320" y1="110" x2="320" y2="150" strokeWidth="1.8" {...line} />
          <line x1="320" y1="150" x2="320" y2="195" strokeWidth="1.8" {...line} />
          <line x1="320" y1="235" x2="320" y2="280" strokeWidth="1.8" {...line} />
          <line x1="24" y1="150" x2="150" y2="150" strokeWidth="1.8" {...line} />
          <line x1="190" y1="150" x2="450" y2="150" strokeWidth="1.8" {...line} />
          <line x1="490" y1="150" x2="616" y2="150" strokeWidth="1.8" {...line} />

          {/* room names */}
          <text x="172" y="42" textAnchor="middle" fontSize="9" letterSpacing="2" fill="currentColor" opacity="0.35" className="font-mono">BEDROOM</text>
          <text x="430" y="90" textAnchor="middle" fontSize="9" letterSpacing="2" fill="currentColor" opacity="0.35" className="font-mono">KITCHEN</text>
          <text x="120" y="172" textAnchor="middle" fontSize="9" letterSpacing="2" fill="currentColor" opacity="0.35" className="font-mono">DRAWING ROOM</text>
          <text x="420" y="172" textAnchor="middle" fontSize="9" letterSpacing="2" fill="currentColor" opacity="0.35" className="font-mono">OFFICE</text>

          {/* bedroom: bed with pillow + rug */}
          <rect x="48" y="52" width="94" height="58" rx="4" strokeWidth="1.8" {...line} />
          <line x1="66" y1="52" x2="66" y2="110" strokeWidth="1.2" opacity="0.6" {...line} />
          <rect x="51" y="62" width="12" height="38" rx="4" strokeWidth="1.2" opacity="0.7" {...line} />
          <circle cx="200" cy="112" r="14" strokeWidth="1" opacity="0.35" {...line} />
          {/* zzz — CSS shows it only while the figure is asleep */}
          <text className="home-zzz font-mono" x="150" y="66" fontSize="10" fill="currentColor" stroke="none">
            z z
          </text>

          {/* kitchen: counter along the top wall, hob, sink, table */}
          <rect x="356" y="26" width="244" height="34" strokeWidth="1.6" {...line} />
          <circle cx="552" cy="43" r="7" strokeWidth="1.3" {...line} />
          <circle cx="576" cy="43" r="7" strokeWidth="1.3" {...line} />
          <rect x="384" y="34" width="34" height="18" rx="3" strokeWidth="1.3" {...line} />
          <circle cx="470" cy="104" r="17" strokeWidth="1.5" {...line} />
          <circle cx="447" cy="96" r="3.5" strokeWidth="1.2" {...line} />
          <circle cx="492" cy="96" r="3.5" strokeWidth="1.2" {...line} />

          {/* drawing room: sofa, table, shelf */}
          <rect x="56" y="196" width="96" height="30" rx="6" strokeWidth="1.8" {...line} />
          <line x1="56" y1="204" x2="152" y2="204" strokeWidth="1.2" opacity="0.6" {...line} />
          <circle cx="110" cy="252" r="13" strokeWidth="1.4" {...line} />
          <rect x="230" y="256" width="70" height="12" strokeWidth="1.4" {...line} />
          {[240, 250, 260, 274, 284].map((x, i) => (
            <line key={x} x1={x} y1={268} x2={x} y2={i % 2 ? 259 : 258} strokeWidth="2" opacity="0.6" {...line} />
          ))}

          {/* office: desk with monitor from above, chairless */}
          <rect x="420" y="192" width="100" height="30" rx="3" strokeWidth="1.8" {...line} />
          <rect x="452" y="197" width="36" height="12" rx="2" strokeWidth="1.4" {...line} />
          <line x1="470" y1="209" x2="470" y2="214" strokeWidth="1.2" {...line} />

          {/* clock + sun/moon, on the hall wall */}
          <text ref={clockRef} x="300" y="14" textAnchor="end" fontSize="12" fill="currentColor" opacity="0.75" className="font-mono" stroke="none">
            12:00
          </text>
          <g className="home-sun">
            <circle cx="328" cy="10" r="5.5" strokeWidth="1.4" {...line} />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line
                key={a}
                x1={328 + 8 * Math.cos((a * Math.PI) / 180)}
                y1={10 + 8 * Math.sin((a * Math.PI) / 180)}
                x2={328 + 10.5 * Math.cos((a * Math.PI) / 180)}
                y2={10 + 10.5 * Math.sin((a * Math.PI) / 180)}
                strokeWidth="1.2"
                {...line}
              />
            ))}
          </g>
          <path className="home-moon" d="M324 4 a7 7 0 1 0 8 11 a5.5 5.5 0 1 1 -8 -11" strokeWidth="1.4" {...line} />

          {/* THE SERVER — click to zoom (kept from E30) */}
          <g className="home-rack" onClick={() => setZoomed((z) => !z)} role="presentation">
            <text x="580" y="176" textAnchor="middle" fontSize="6.5" fill="currentColor" opacity="0.6" className="font-mono" stroke="none">
              SRV-01
            </text>
            <rect x="560" y="180" width="40" height="82" rx="2" strokeWidth="1.8" {...line} />
            {units.map((u, i) => (
              <g
                key={u.id}
                className={`rack-unit ${inspected?.id === u.id ? "rack-unit-hot" : ""}`}
                onMouseEnter={() => setInspected(u)}
                onMouseLeave={() => setInspected(null)}
              >
                <rect x="564" y={186 + i * 13} width="32" height="11" rx="1.5" strokeWidth="0.9" {...line} />
                <circle className="rack-led" cx="568" cy={191.5 + i * 13} r="1.4" fill="currentColor" style={{ animationDelay: `${i * 0.35}s` }} />
                <text x="572" y={193.5 + i * 13} fontSize="4.2" fill="currentColor" className="font-mono" stroke="none">
                  {u.label}
                </text>
                <title>{u.detail}</title>
              </g>
            ))}
            {units.length === 0 && (
              <text x="580" y="224" textAnchor="middle" fontSize="4.6" fill="currentColor" opacity="0.5" className="font-mono" stroke="none">
                powered down
              </text>
            )}
          </g>

          {/* celebration — bursts when the selected month began something (E36) */}
          {startedNow.length > 0 && (
            <g key={idx} className="fx-confetti">
              {[...Array(10)].map((_, i) => {
                const a = (i / 10) * Math.PI * 2;
                return (
                  <line
                    key={i}
                    x1={470 + 14 * Math.cos(a)}
                    y1={207 + 14 * Math.sin(a)}
                    x2={470 + 30 * Math.cos(a)}
                    y2={207 + 30 * Math.sin(a)}
                    strokeWidth="2"
                    {...line}
                    style={{ animationDelay: `${(i % 5) * 0.05}s` }}
                  />
                );
              })}
            </g>
          )}

          {/* Zahid — standing, walking his day on his own (E34) */}
          <g ref={figRef} className="home-fig" transform={`translate(${SPOT.desk.x} ${SPOT.desk.y})`} data-walking="false" data-sleeping="false">
            <line className="fig-foot-a" x1="-4" y1="8" x2="-4" y2="13" strokeWidth="2.6" {...line} />
            <line className="fig-foot-b" x1="4" y1="8" x2="4" y2="13" strokeWidth="2.6" {...line} />
            <ellipse cx="0" cy="1" rx="9" ry="10.5" strokeWidth="2" {...line} />
            <circle cx="0" cy="-1" r="5.6" fill="currentColor" />
          </g>
        </g>
      </svg>

      <div className="office-controls">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="office-btn"
            aria-pressed={playing}
            onClick={() => {
              if (playing) {
                setPlaying(false);
              } else {
                if (pos >= total - 1) setPos(0);
                setPlaying(true);
              }
            }}
          >
            {playing ? "◼ Stop" : "▶ Play my career"}
          </button>
          <button type="button" className="office-btn" onClick={() => jump(-12)} aria-label="Back one year">−1y</button>
          <input
            type="range"
            min={0}
            max={total - 1}
            step={1}
            value={pos}
            onChange={(e) => {
              setPlaying(false);
              setPos(Number(e.target.value));
            }}
            className="office-range"
            aria-label="Career timeline, one step per month"
            aria-valuetext={indexToLabel(idx)}
          />
          <button type="button" className="office-btn" onClick={() => jump(12)} aria-label="Forward one year">+1y</button>
          <button type="button" className="office-btn" onClick={() => setPos(total - 1)}>Latest</button>
          <button type="button" className="office-btn" aria-pressed={zoomed} onClick={() => setZoomed((z) => !z)}>
            {zoomed ? "← Back to the house" : "Inspect the server"}
          </button>
        </div>
        <p className="mt-3 font-mono text-sm font-semibold" aria-live="polite">
          {indexToLabel(idx)}
        </p>
      </div>

      {startedNow.length > 0 && (
        <p className="office-banner" aria-live="polite">
          {startedNow.map((s) => (
            <span key={s} className="office-banner-item">✳ {s}</span>
          ))}
        </p>
      )}

      {zoomed ? (
        <div className="office-inspect" aria-live="polite">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Plugged in, {indexToLabel(idx)}
          </p>
          <ul className="office-activities">
            {units.map((u) => (
              <li key={u.id} className={inspected?.id === u.id ? "font-semibold" : undefined}>
                <span className="office-tag">unit</span>
                {u.detail}
              </li>
            ))}
            {units.length === 0 && <li className="text-muted">Nothing running — the record is quiet this month.</li>}
          </ul>
        </div>
      ) : (
        /* What exactly was happening (E37): real CV bullets and repo detail. */
        <div className="office-detail" aria-live="polite">
          {working.map((w) => (
            <div key={`w-${w.head}-${w.sub}`} className="office-card">
              <p><span className="office-tag">working</span><strong>{w.head}</strong> · {w.sub}</p>
              <ul>
                {w.detail.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          ))}
          {studying.map((s) => (
            <div key={`s-${s.head}`} className="office-card">
              <p><span className="office-tag">studying</span><strong>{s.head}</strong> · {s.sub}</p>
              <ul>
                {s.detail.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          ))}
          {building.length > 0 && (
            <div className="office-card">
              <p><span className="office-tag">building</span><strong>{building.length === 1 ? building[0].name : `${building.length} projects in flight`}</strong></p>
              <ul>
                {building.map((b) => (
                  <li key={b.name}>
                    {b.name}
                    {b.n > 0 && ` — ${b.n} commit${b.n === 1 ? "" : "s"} this month`}
                    {b.description && ` · ${b.description}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {volunteeringNow.map((v) => (
            <div key={`v-${v.head}`} className="office-card">
              <p><span className="office-tag">volunteering</span><strong>{v.head}</strong> · {v.sub}</p>
              {v.detail.length > 0 && <ul>{v.detail.map((b) => <li key={b}>{b}</li>)}</ul>}
            </div>
          ))}
          {earned.map((c) => (
            <div key={`c-${c.head}`} className="office-card">
              <p><span className="office-tag">earned</span><strong>{c.head}</strong> · {c.sub}</p>
            </div>
          ))}
          {!working.length && !studying.length && !building.length && !volunteeringNow.length && !earned.length && (
            <p className="text-muted text-sm">A quiet month — nothing on record.</p>
          )}
        </div>
      )}
    </div>
  );
}
