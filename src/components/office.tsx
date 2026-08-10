"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { certificates, education, experience, volunteering } from "@/content/profile";
import type { CommitHistory, Repo } from "@/lib/github";

// Three.js only ever loads on the client, and only when the section nears
// the viewport (the component gates the engine behind an IntersectionObserver).
const House3D = dynamic(() => import("./house3d/house3d").then((m) => m.House3D), {
  ssr: false,
  loading: () => <div className="h3d-shell-loading">building the house…</div>,
});

/**
 * Section 02: the isometric house (E38–E44) with the career timeline under it.
 *
 * The house shows *today* — the avatar walks Zahid's real daily schedule and
 * the page theme follows its sun. The controls below answer *the years*: a
 * month scrubber with auto-play, celebration bursts on months where something
 * began, and a detail panel of what exactly was running (E36/E37, kept from
 * the previous round because Zahid approved them explicitly).
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

  const lastPush = useMemo(() => {
    if (!repos.length) return null;
    const r = [...repos].sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))[0];
    return { name: r.name, at: r.pushedAt };
  }, [repos]);

  return (
    <div className="office">
      <House3D lastPush={lastPush} />

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

      {/* What exactly was happening (E37): real CV bullets and repo detail. */}
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
    </div>
  );
}
