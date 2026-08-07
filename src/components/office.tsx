"use client";

import { useMemo, useState } from "react";
import { certificates, education, experience, volunteering } from "@/content/profile";
import type { CommitHistory, Repo } from "@/lib/github";

/**
 * The home (E29) and the server room (E30).
 *
 * A cutaway of Zahid's home — bedroom, kitchen, office — where he appears in
 * the room his month dictates: at the office desk when working or building, at
 * the bedroom desk with a book when studying, in the kitchen when the record
 * is quiet. In the office stands a server rack: click it and the camera zooms
 * in, game-style, to show what was "plugged in" that month — one unit per
 * active role and repo — and hovering a unit says what he was doing on it.
 *
 * Same honest data model the timeline was approved with: month granularity,
 * every claim traced to profile.ts (the CV/LinkedIn extraction) or git dates.
 * The domain ends at the latest *data* month, not Date.now(), which keeps
 * server and client renders byte-identical.
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

type Span = { start: number; end: number | null; head: string; sub: string };
type Point = { at: number; head: string; sub: string };

function parseSpan(dates: string, head: string, sub: string): Span | null {
  const [from, to] = dates.split("–").map((part) => part.trim());
  const start = monthIndex(from);
  if (start === null) return null;
  const end = to === "Present" ? null : monthIndex(to ?? "");
  return { start, end, head, sub };
}

/** One slot in the rack: a thing that was running this month. */
type Unit = { id: string; label: string; detail: string };

const line = { stroke: "currentColor", fill: "none", strokeLinecap: "round" as const };

export function Office({
  repos,
  commits,
}: {
  repos: Pick<Repo, "name" | "createdAt" | "pushedAt">[];
  commits: CommitHistory | null;
}) {
  const model = useMemo(() => {
    const work = experience
      .map((r) => parseSpan(r.dates, r.title, r.company))
      .filter((s): s is Span => s !== null);
    const study = education
      .map((e) => parseSpan(e.dates, e.degree, e.school))
      .filter((s): s is Span => s !== null);
    const volunteer = volunteering
      .map((v) => parseSpan(v.dates, v.role, v.org))
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
        .map(([name, byMonth]) => ({ name, n: byMonth[monthKey] }))
        .sort((a, b) => b.n - a.n)
    : model.repoSpans.filter(inSpan).map((r) => ({ name: r.name, n: 0 }));

  // What's plugged into the rack this month: roles first, then repos by commits.
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

  const mode = working.length || building.length ? "work" : studying.length ? "study" : "rest";
  const jump = (months: number) => setPos((p) => Math.min(Math.max(p + months, 0), total - 1));

  // The camera: zooming means transforming the whole scene so the rack fills
  // the frame — one moving element, smoothly transitioned (instant under
  // reduced motion via CSS). Rack centre is (563, 168); frame centre (320, 130).
  // 2×, not 3×: the rack (with its SRV-01 label) is 127 user-units tall, and
  // 2 × 127 = 254 fits the 260-unit frame exactly — at 3× the top unit was
  // clipped. The desk and figure stay in frame for context.
  const ZOOM = 2;
  const sceneTransform = zoomed
    ? `matrix(${ZOOM}, 0, 0, ${ZOOM}, ${320 - ZOOM * 563}, ${130 - ZOOM * 168})`
    : "matrix(1, 0, 0, 1, 0, 0)";

  // Where Zahid stands or sits, by month.
  const dev =
    mode === "work" ? { x: 448, y: 148, sit: true }
    : mode === "study" ? { x: 128, y: 152, sit: true }
    : { x: 300, y: 128, sit: false };

  const screenLabel = (units[0]?.label ?? (studying.length ? "revision" : "idle")).slice(0, 10);

  return (
    <div className="office">
      <svg viewBox="0 0 640 260" className="office-svg home-svg" data-mode={mode} aria-hidden focusable="false">
        <g className="home-scene" style={{ transform: sceneTransform }}>
          {/* the house shell */}
          <path d="M20 72 L320 16 L620 72" strokeWidth="2.4" {...line} />
          <path d="M540 28 v14 h14 v-19" strokeWidth="2" {...line} />
          <line x1="36" y1="68" x2="36" y2="238" strokeWidth="2" {...line} />
          <line x1="604" y1="68" x2="604" y2="238" strokeWidth="2" {...line} />
          <line x1="16" y1="238" x2="624" y2="238" strokeWidth="2.4" {...line} />
          {/* room dividers */}
          <line x1="225" y1="94" x2="225" y2="238" strokeWidth="1.6" opacity="0.6" {...line} />
          <line x1="410" y1="82" x2="410" y2="238" strokeWidth="1.6" opacity="0.6" {...line} />
          {/* room labels — part of the map, always faintly on */}
          <text x="130" y="110" textAnchor="middle" fontSize="9" letterSpacing="2" fill="currentColor" opacity="0.4" className="font-mono">BEDROOM</text>
          <text x="317" y="110" textAnchor="middle" fontSize="9" letterSpacing="2" fill="currentColor" opacity="0.4" className="font-mono">KITCHEN</text>
          <text x="505" y="98" textAnchor="middle" fontSize="9" letterSpacing="2" fill="currentColor" opacity="0.4" className="font-mono">OFFICE</text>

          {/* bedroom: bed + study desk */}
          <path d="M52 238 v-30 h8 v14 h74 v16" strokeWidth="1.8" {...line} />
          <line x1="60" y1="224" x2="134" y2="224" strokeWidth="1.4" opacity="0.6" {...line} />
          <line x1="150" y1="182" x2="205" y2="182" strokeWidth="2" {...line} />
          <line x1="155" y1="182" x2="155" y2="238" strokeWidth="1.6" {...line} />
          <line x1="200" y1="182" x2="200" y2="238" strokeWidth="1.6" {...line} />
          {/* the book lives on the bedroom desk */}
          <g className="office-book">
            <path d="M162 178 q8 -5 16 0 q8 -5 16 0 v3 q-8 -4 -16 0 q-8 -4 -16 0 z" strokeWidth="1.3" {...line} />
            <line className="office-page" x1="178" y1="176" x2="178" y2="179" strokeWidth="1.1" {...line} />
          </g>

          {/* kitchen: counter, kettle, shelf */}
          <line x1="240" y1="186" x2="340" y2="186" strokeWidth="2" {...line} />
          <line x1="245" y1="186" x2="245" y2="238" strokeWidth="1.6" {...line} />
          <line x1="335" y1="186" x2="335" y2="238" strokeWidth="1.6" {...line} />
          <path d="M300 186 v-12 q0 -6 8 -6 h6 q8 0 8 6 v12" strokeWidth="1.5" {...line} />
          <path d="M322 172 q6 0 6 6" strokeWidth="1.3" {...line} />
          <g className="home-steam">
            <path d="M310 164 q3 -5 0 -10" strokeWidth="1.2" opacity="0.5" {...line} />
          </g>
          <line x1="250" y1="140" x2="330" y2="140" strokeWidth="1.4" {...line} />
          {[258, 270, 282, 300, 312].map((x, i) => (
            <line key={x} x1={x} y1={140} x2={x} y2={i % 2 ? 130 : 128} strokeWidth="2.2" opacity="0.6" {...line} />
          ))}

          {/* office: desk, monitor with live screen, chair */}
          <line x1="420" y1="176" x2="520" y2="176" strokeWidth="2.2" {...line} />
          <line x1="426" y1="176" x2="426" y2="238" strokeWidth="1.6" {...line} />
          <line x1="514" y1="176" x2="514" y2="238" strokeWidth="1.6" {...line} />
          <g className="office-monitor">
            <rect x="462" y="140" width="50" height="32" rx="2" strokeWidth="1.8" {...line} />
            <line x1="487" y1="172" x2="487" y2="176" strokeWidth="1.8" {...line} />
            <text x="468" y="153" fontSize="7" fill="currentColor" className="font-mono" stroke="none">
              &gt; {screenLabel}
            </text>
            <line className="office-cursor" x1="468" y1="160" x2="482" y2="160" strokeWidth="1.4" {...line} />
          </g>

          {/* Zahid — slides to the room the month puts him in */}
          <g className="home-dev" style={{ transform: `translate(${dev.x}px, ${dev.y}px)` }}>
            {dev.sit ? (
              <g>
                <circle cx="0" cy="-38" r="6" fill="currentColor" />
                <path d="M0 -32 v20" strokeWidth="2.8" {...line} />
                <g className="office-arm">
                  <path d="M0 -26 q12 5 20 12" strokeWidth="2.2" {...line} />
                </g>
                <path d="M0 -12 q-2 10 -10 14" strokeWidth="2.4" {...line} />
                <line x1="-13" y1="-34" x2="-13" y2="6" strokeWidth="1.6" {...line} />
                <line x1="-20" y1="6" x2="-2" y2="6" strokeWidth="1.6" {...line} />
                <line x1="-11" y1="6" x2="-11" y2="30" strokeWidth="1.4" {...line} />
              </g>
            ) : (
              <g>
                <circle cx="0" cy="-30" r="6" fill="currentColor" />
                <path d="M0 -24 v26" strokeWidth="2.8" {...line} />
                <path d="M0 -16 q10 2 16 -4" strokeWidth="2.2" {...line} />
                <path d="M0 -16 q-8 6 -12 2" strokeWidth="2.2" {...line} />
                <line x1="0" y1="2" x2="-6" y2="30" strokeWidth="2.4" {...line} />
                <line x1="0" y1="2" x2="6" y2="30" strokeWidth="2.4" {...line} />
              </g>
            )}
          </g>

          {/* THE SERVER — click to zoom in and inspect (E30) */}
          <g
            className="home-rack"
            onClick={() => setZoomed((z) => !z)}
            role="presentation"
          >
            <rect x="540" y="112" width="46" height="118" rx="2" strokeWidth="1.8" {...line} />
            <text x="563" y="108" textAnchor="middle" fontSize="6.5" fill="currentColor" opacity="0.6" className="font-mono" stroke="none">
              SRV-01
            </text>
            {units.map((u, i) => (
              <g
                key={u.id}
                className={`rack-unit ${inspected?.id === u.id ? "rack-unit-hot" : ""}`}
                onMouseEnter={() => setInspected(u)}
                onMouseLeave={() => setInspected(null)}
              >
                <rect x="544" y={117 + i * 18} width="38" height="14" rx="1.5" strokeWidth="1" {...line} />
                <circle className="rack-led" cx="549" cy={124 + i * 18} r="1.6" fill="currentColor" style={{ animationDelay: `${i * 0.35}s` }} />
                <text x="554" y={126.5 + i * 18} fontSize="4.6" fill="currentColor" className="font-mono" stroke="none">
                  {u.label}
                </text>
                <title>{u.detail}</title>
              </g>
            ))}
            {units.length === 0 && (
              <text x="563" y="175" textAnchor="middle" fontSize="5" fill="currentColor" opacity="0.5" className="font-mono" stroke="none">
                powered down
              </text>
            )}
          </g>
        </g>
      </svg>

      <div className="office-controls">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="office-btn" onClick={() => jump(-12)} aria-label="Back one year">−1y</button>
          <input
            type="range"
            min={0}
            max={total - 1}
            step={1}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            className="office-range"
            aria-label="Career timeline, one step per month"
            aria-valuetext={indexToLabel(idx)}
          />
          <button type="button" className="office-btn" onClick={() => jump(12)} aria-label="Forward one year">+1y</button>
          <button type="button" className="office-btn" onClick={() => setPos(total - 1)}>Latest</button>
          <button
            type="button"
            className="office-btn"
            aria-pressed={zoomed}
            onClick={() => setZoomed((z) => !z)}
          >
            {zoomed ? "← Back to the house" : "Inspect the server"}
          </button>
        </div>
        <p className="mt-3 font-mono text-sm font-semibold" aria-live="polite">
          {indexToLabel(idx)}
        </p>
      </div>

      {/* The inspect panel — the readable truth behind the scene. */}
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
        <ul className="office-activities" aria-live="polite">
          {working.map((w) => (
            <li key={`w-${w.head}-${w.sub}`}><span className="office-tag">working</span>{w.head} · {w.sub}</li>
          ))}
          {studying.map((s) => (
            <li key={`s-${s.head}`}><span className="office-tag">studying</span>{s.head} · {s.sub}</li>
          ))}
          {building.length > 0 && (
            <li>
              <span className="office-tag">building</span>
              {building.map((b) => (b.n > 0 ? `${b.name} (${b.n} commit${b.n === 1 ? "" : "s"})` : b.name)).join(", ")}
            </li>
          )}
          {volunteeringNow.map((v) => (
            <li key={`v-${v.head}`}><span className="office-tag">volunteering</span>{v.head} · {v.sub}</li>
          ))}
          {earned.map((c) => (
            <li key={`c-${c.head}`}><span className="office-tag">earned</span>{c.head} · {c.sub}</li>
          ))}
          {!working.length && !studying.length && !building.length && !volunteeringNow.length && !earned.length && (
            <li className="text-muted">A quiet month — nothing on record.</li>
          )}
        </ul>
      )}

      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted">
        Month granularity, because that is what the sources carry — roles and study from the CV,
        commits from git{commits ? " (fetched at build)" : ""}. Nothing here is invented.
      </p>
    </div>
  );
}
