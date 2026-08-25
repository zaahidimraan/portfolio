"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getHouseApi } from "./house3d/api";

/**
 * The guided site tour (E52): eight stops, each with a spotlight, a caption
 * and an AI-narrated audio clip (ElevenLabs, clearly labelled). Two stops
 * drive the 3D house's camera through the engine API.
 *
 * Accessibility, by design: starts only on click (autoplay stays blocked
 * anyway), every stop has prev/pause/next/close and Esc, captions mirror the
 * narration in an aria-live region, a full transcript is one toggle away,
 * and reduced-motion visitors get instant scrolls with no spotlight easing.
 * One <audio> element is reused so later steps inherit the user activation.
 */

type Step = {
  /** CSS selector for the spotlight target; "__top" means the hero. */
  sel: string;
  focus?: "office" | "server";
  audio: string;
  text: string;
};

const STEPS: Step[] = [
  { sel: "__top", audio: "/tour/01-hero.mp3", text: "Hi — I'm Zahid Imran, an AI engineer based in Manchester. Recruiters see hundreds of portfolios that all say the same things. So instead of telling you I build production AI — I'd rather show you. Stick with me for two minutes." },
  { sel: "#impact", audio: "/tour/02-impact.mp3", text: "Let's start with evidence. Every number on this wall comes from a system that actually ran in production, and every one links to its proof. 85% agreement between my LLM judge and human reviewers. 40% fewer false positives in screening. No vanity metrics — receipts." },
  { sel: "#office", audio: "/tour/03-house.mp3", text: "And this is where it gets fun: my day, rebuilt as a 3D house. The little character is me — he keeps my real daily schedule, and the sunlight follows the actual clock. Drag to orbit; click any room to step inside. Every room stands for a section of this site — the house is a map of everything you're about to see." },
  { sel: "#office", focus: "office", audio: "/tour/04-office.mp3", text: "Step into the office — three screens, one chair, and the work I do at POWWR on the innovation team: document-AI pipelines that read the messy paperwork of the energy industry, and the agentic tooling and evaluation that make those systems trustworthy." },
  { sel: "#office", focus: "server", audio: "/tour/05-server.mp3", text: "The server room isn't decoration — it's real. This site runs a live MCP server. Connect Claude, Cursor, or any AI client, and ask it anything about my CV. It answers from the facts, and only the facts. Go on — interrogate my experience. That's exactly what it's for." },
  { sel: "#projects", audio: "/tour/06-projects.mp3", text: "Three flagship builds tell the story best: an omni-channel AI executive assistant; an autonomous recruitment agent judged by an LLM — that's where the 85% lives; and a privacy-preserving PII redaction pipeline that runs entirely on local models. Architectures included. Nothing hand-waved." },
  { sel: "#skills", audio: "/tour/07-skills.mp3", text: "Skills pages are usually wish-lists. Mine come with receipts: click any skill, and it lights up the exact projects and roles where it earned its place — from agentic orchestration to evaluation and cost engineering." },
  { sel: "footer", audio: "/tour/08-outro.mp3", text: "That's the tour — the rest rewards exploring. If you're hiring for AI engineering in the UK, the door is open: grab the CV, connect the MCP server, or just say hello. Thanks for listening." },
];

const PULSE_ENDPOINT = "https://site-pulse.zaahidimraan.workers.dev/a";

function pulseTour(kind: "start" | "complete") {
  try {
    if (navigator.doNotTrack === "1") return;
    navigator.sendBeacon?.(PULSE_ENDPOINT, JSON.stringify({ tour: kind }));
  } catch {
    /* analytics must never break the tour */
  }
}

export function Tour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [spot, setSpot] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measure = useCallback((sel: string) => {
    const el = sel === "__top" ? document.querySelector("main") : document.querySelector(sel);
    if (!el) {
      setSpot(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const h = sel === "__top" ? Math.min(r.height, window.innerHeight * 0.7) : Math.min(r.height, window.innerHeight * 0.86);
    setSpot({ x: r.left - 8, y: Math.max(r.top - 8, 8), w: r.width + 16, h });
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const s = STEPS[i];
      setStep(i);
      setPaused(false);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (s.sel === "__top") {
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      } else {
        document.querySelector(s.sel)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      }
      const api = getHouseApi();
      if (s.focus) api?.focusRoom(s.focus);
      else api?.overview();
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => measure(s.sel), reduced ? 60 : 550);
      const audio = audioRef.current;
      if (audio) {
        audio.src = s.audio;
        // Defensive: a muted element or zeroed volume would read as "broken
        // tour" — narration silence must only ever be a policy rejection,
        // which the visible sound button then recovers from.
        audio.muted = false;
        audio.volume = 1;
        audio.play().catch(() => setPaused(true));
      }
    },
    [measure],
  );

  const end = useCallback(
    (completed: boolean) => {
      setActive(false);
      setSpot(null);
      setShowTranscript(false);
      audioRef.current?.pause();
      getHouseApi()?.overview();
      if (completed) pulseTour("complete");
    },
    [],
  );

  const start = () => {
    setActive(true);
    pulseTour("start");
    goTo(0);
  };

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") end(false);
    };
    const onMove = () => measure(STEPS[step].sel);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove);
    };
  }, [active, step, measure, end]);

  const onEnded = () => {
    if (step < STEPS.length - 1) goTo(step + 1);
    else end(true);
  };

  const togglePause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => undefined);
      setPaused(false);
    } else {
      audio.pause();
      setPaused(true);
    }
  };

  return (
    <>
      {!active && (
        <div className="tour-launch">
          <button type="button" onClick={start}>
            ▶ Take the guided tour
          </button>
          <span>AI-narrated · ~2½ min · captions · esc to leave</span>
        </div>
      )}

      {/* One reusable element keeps the user-activation for every step; the
          element's own events are the source of truth for the UI state, so a
          browser-initiated pause can never leave the controls lying. */}
      <audio
        ref={audioRef}
        onEnded={onEnded}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        preload="none"
      />

      {active && (
        <div className="tour" role="region" aria-label="Guided site tour">
          {spot && (
            <div
              className="tour-spot"
              aria-hidden
              style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h }}
            />
          )}
          <div className="tour-card">
            <p className="tour-tag">
              AI-narrated tour · {step + 1}/{STEPS.length}
            </p>
            <p className="tour-caption" aria-live="polite">
              {STEPS[step].text}
            </p>
            {paused && (
              <button type="button" className="tour-sound" onClick={togglePause}>
                🔊 tap to hear the narration
              </button>
            )}
            <div className="tour-controls">
              <button type="button" onClick={() => goTo(Math.max(0, step - 1))} disabled={step === 0} aria-label="Previous stop">⏮</button>
              <button type="button" onClick={togglePause} aria-label={paused ? "Play narration" : "Pause narration"}>
                {paused ? "▶" : "❙❙"}
              </button>
              <button type="button" onClick={onEnded} aria-label="Next stop">⏭</button>
              <button type="button" onClick={() => setShowTranscript((v) => !v)} aria-expanded={showTranscript}>
                transcript
              </button>
              <button type="button" onClick={() => end(false)} aria-label="End the tour">✕ end</button>
            </div>
            {showTranscript && (
              <ol className="tour-transcript">
                {STEPS.map((s, i) => (
                  <li key={s.audio} className={i === step ? "is-now" : undefined}>{s.text}</li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </>
  );
}
