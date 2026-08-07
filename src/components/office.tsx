"use client";

import { useMemo, useState } from "react";
import { certificates, education, experience, volunteering } from "@/content/profile";
import type { CommitHistory, Repo } from "@/lib/github";

/**
 * The office at the end of the street (E25).
 *
 * One character — Zahid, at his desk. The visitor scrubs a month-granularity
 * timeline and the scene answers "what was he doing then?": working, studying,
 * building, volunteering, earning a certificate. Every line shown traces to a
 * profile.ts entry (the CV/LinkedIn extraction) or a git date; nothing is
 * invented, which is also why the resolution is months — that is the finest
 * grain the sources actually carry.
 */

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "Sep 2024" → absolute month index; null if the label doesn't parse. */
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

    // The domain ends at the latest *data* month, not Date.now() — that keeps
    // server and client renders byte-identical (no hydration drift) and keeps
    // the claim honest: the timeline runs exactly as far as the evidence does.
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
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    return { work, study, volunteer, certs, repoSpans, min, max };
  }, [repos]);

  const total = model.max - model.min + 1;
  const [pos, setPos] = useState(total - 1); // land on the latest month

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
    : model.repoSpans
        .filter(inSpan)
        .map((r) => ({ name: r.name, n: 0 }));

  const mode = working.length || building.length ? "work" : studying.length ? "study" : "rest";
  const jump = (months: number) =>
    setPos((p) => Math.min(Math.max(p + months, 0), total - 1));

  const line = { stroke: "currentColor", fill: "none", strokeLinecap: "round" as const };

  return (
    <div className="office">
      <svg
        viewBox="0 0 360 190"
        className="office-svg"
        data-mode={mode}
        aria-hidden
        focusable="false"
      >
        {/* the house: gable roof, chimney, walls */}
        <path d="M30 66 L180 16 L330 66" strokeWidth="2.4" {...line} />
        <path d="M262 26 v16 h14 v-21" strokeWidth="2" {...line} />
        <line x1="44" y1="62" x2="44" y2="174" strokeWidth="2" {...line} />
        <line x1="316" y1="62" x2="316" y2="174" strokeWidth="2" {...line} />
        <line x1="20" y1="174" x2="340" y2="174" strokeWidth="2.4" {...line} />

        {/* wall clock — its hands track the timeline position */}
        <circle cx="112" cy="84" r="11" strokeWidth="1.5" {...line} />
        <line
          x1="112" y1="84" x2="112" y2="77"
          strokeWidth="1.6" {...line}
          transform={`rotate(${(pos / Math.max(total - 1, 1)) * 720} 112 84)`}
        />
        <line
          x1="112" y1="84" x2="117" y2="84"
          strokeWidth="1.2" {...line}
          transform={`rotate(${(pos / Math.max(total - 1, 1)) * 8640} 112 84)`}
        />

        {/* bookshelf — books standing on two shelves */}
        <line x1="238" y1="78" x2="304" y2="78" strokeWidth="1.6" {...line} />
        <line x1="238" y1="60" x2="304" y2="60" strokeWidth="1.6" {...line} />
        {[244, 252, 260, 272, 280, 292].map((x, i) => (
          <line
            key={x}
            x1={x}
            y1={78}
            x2={x}
            y2={i % 2 ? 66 : 64}
            strokeWidth="2.6"
            opacity="0.7"
            {...line}
          />
        ))}

        {/* desk */}
        <line x1="150" y1="132" x2="300" y2="132" strokeWidth="2.2" {...line} />
        <line x1="158" y1="132" x2="158" y2="174" strokeWidth="1.8" {...line} />
        <line x1="292" y1="132" x2="292" y2="174" strokeWidth="1.8" {...line} />

        {/* monitor — lit while working or building */}
        <g className="office-monitor">
          <rect x="216" y="100" width="46" height="28" rx="2" strokeWidth="1.8" {...line} />
          <line x1="239" y1="128" x2="239" y2="132" strokeWidth="1.8" {...line} />
          <line className="office-cursor" x1="222" y1="108" x2="238" y2="108" strokeWidth="1.6" {...line} />
          <line x1="222" y1="114" x2="248" y2="114" strokeWidth="1.6" opacity="0.5" {...line} />
          <line x1="222" y1="120" x2="232" y2="120" strokeWidth="1.6" opacity="0.5" {...line} />
        </g>

        {/* the open book — out while studying */}
        <g className="office-book">
          <path d="M168 128 q10 -6 20 0 q10 -6 20 0 v4 q-10 -5 -20 0 q-10 -5 -20 0 z" strokeWidth="1.4" {...line} />
          <line className="office-page" x1="188" y1="126" x2="188" y2="130" strokeWidth="1.2" {...line} />
        </g>

        {/* Zahid, at the desk — the street's one character */}
        <g className="office-dev">
          <circle cx="196" cy="96" r="6.5" fill="currentColor" />
          <path d="M196 103 v22" strokeWidth="3" {...line} />
          <g className="office-arm">
            <path d="M196 110 q14 6 22 14" strokeWidth="2.4" {...line} />
          </g>
          <path d="M196 125 q-2 12 -12 16" strokeWidth="2.6" {...line} />
          {/* chair */}
          <line x1="182" y1="104" x2="182" y2="148" strokeWidth="1.8" {...line} />
          <line x1="174" y1="148" x2="196" y2="148" strokeWidth="1.8" {...line} />
          <line x1="185" y1="148" x2="185" y2="174" strokeWidth="1.6" {...line} />
        </g>

        {/* desk lamp, always faithfully on for the worker */}
        <path d="M280 132 v-14 q0 -6 -8 -6" strokeWidth="1.6" {...line} />
        <circle className="office-lamp" cx="269" cy="112" r="3" fill="currentColor" />
      </svg>

      <div className="office-controls">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="office-btn" onClick={() => jump(-12)} aria-label="Back one year">
            −1y
          </button>
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
          <button type="button" className="office-btn" onClick={() => jump(12)} aria-label="Forward one year">
            +1y
          </button>
          <button type="button" className="office-btn" onClick={() => setPos(total - 1)}>
            Latest
          </button>
        </div>
        <p className="mt-3 font-mono text-sm font-semibold" aria-live="polite">
          {indexToLabel(idx)}
        </p>
      </div>

      <ul className="office-activities" aria-live="polite">
        {working.map((w) => (
          <li key={`w-${w.head}-${w.sub}`}>
            <span className="office-tag">working</span>
            {w.head} · {w.sub}
          </li>
        ))}
        {studying.map((s) => (
          <li key={`s-${s.head}`}>
            <span className="office-tag">studying</span>
            {s.head} · {s.sub}
          </li>
        ))}
        {building.length > 0 && (
          <li>
            <span className="office-tag">building</span>
            {building
              .map((b) => (b.n > 0 ? `${b.name} (${b.n} commit${b.n === 1 ? "" : "s"})` : b.name))
              .join(", ")}
          </li>
        )}
        {volunteeringNow.map((v) => (
          <li key={`v-${v.head}`}>
            <span className="office-tag">volunteering</span>
            {v.head} · {v.sub}
          </li>
        ))}
        {earned.map((c) => (
          <li key={`c-${c.head}`}>
            <span className="office-tag">earned</span>
            {c.head} · {c.sub}
          </li>
        ))}
        {!working.length && !studying.length && !building.length && !volunteeringNow.length && !earned.length && (
          <li className="text-muted">A quiet month — nothing on record.</li>
        )}
      </ul>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted">
        Month granularity, because that is what the sources carry — roles and study from the CV,
        commits from git{commits ? " (fetched at build)" : ""}. Nothing here is invented.
      </p>
    </div>
  );
}
