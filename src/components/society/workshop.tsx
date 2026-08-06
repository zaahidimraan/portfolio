"use client";

import { useNight } from "@/lib/use-night";

const S = { stroke: "currentColor", fill: "none", strokeLinecap: "round" as const };

/**
 * The workshop on the services page — where commissions are taken.
 *
 * Shares the town clock (SOC-11): after dark the forge glows, the lamp comes
 * on and the sign reads differently, matching the citizens on the homepage.
 */
export function Workshop() {
  const night = useNight();
  const isNight = night ?? false;

  return (
    <div className="workshop no-print" aria-hidden="true" data-night={isNight ? "true" : "false"}>
      <svg viewBox="0 0 320 120" className="workshop-svg" focusable="false">
        {/* building */}
        <path d="M20 118 V52 L74 22 L128 52 v66 z" strokeWidth="1.6" {...S} />
        {/* door */}
        <rect x="60" y="86" width="28" height="32" strokeWidth="1.4" {...S} />
        {/* window, lit after dark */}
        <rect x="34" y="62" width="22" height="18" strokeWidth="1.3" {...S} className="workshop-window" />
        <line x1="45" y1="62" x2="45" y2="80" strokeWidth="1" {...S} />
        {/* chimney with drifting smoke */}
        <path d="M98 36 V22 h10 v20" strokeWidth="1.4" {...S} />
        <g className="workshop-smoke">
          <circle cx="103" cy="16" r="3" fill="currentColor" opacity="0.25" />
          <circle cx="107" cy="8" r="4" fill="currentColor" opacity="0.16" />
          <circle cx="112" cy="-1" r="5" fill="currentColor" opacity="0.09" />
        </g>
        {/* hanging sign */}
        <line x1="128" y1="58" x2="150" y2="58" strokeWidth="1.4" {...S} />
        <line x1="146" y1="58" x2="146" y2="66" strokeWidth="1" {...S} />
        <g className="workshop-sign">
          <rect x="128" y="66" width="38" height="18" rx="2" strokeWidth="1.3" {...S} />
          <text
            x="147"
            y="78"
            fontSize="8"
            textAnchor="middle"
            fill="currentColor"
            className="font-mono"
          >
            {isNight ? "CLOSED" : "OPEN"}
          </text>
        </g>

        {/* the smith at the bench */}
        <line x1="196" y1="96" x2="252" y2="96" strokeWidth="1.8" {...S} />
        <line x1="202" y1="96" x2="202" y2="118" strokeWidth="1.4" {...S} />
        <line x1="246" y1="96" x2="246" y2="118" strokeWidth="1.4" {...S} />
        <circle cx="212" cy="66" r="5" fill="currentColor" />
        <line x1="212" y1="71" x2="212" y2="88" strokeWidth="2.6" {...S} />
        <line x1="212" y1="88" x2="206" y2="118" strokeWidth="2.2" {...S} />
        <line x1="212" y1="88" x2="219" y2="118" strokeWidth="2.2" {...S} />
        <line x1="212" y1="75" x2="200" y2="88" strokeWidth="2" {...S} />
        <g className="workshop-arm">
          <line x1="212" y1="75" x2="232" y2="82" strokeWidth="2" {...S} />
          <line x1="228" y1="80" x2="240" y2="86" strokeWidth="3.4" {...S} />
        </g>
        {/* sparks from the strike */}
        <g className="workshop-sparks">
          <circle cx="242" cy="90" r="1.4" fill="currentColor" />
          <circle cx="248" cy="86" r="1" fill="currentColor" />
          <circle cx="246" cy="94" r="0.9" fill="currentColor" />
        </g>

        {/* ground */}
        <line x1="0" y1="118" x2="320" y2="118" strokeWidth="1" {...S} opacity="0.4" />
      </svg>
    </div>
  );
}

/** Small tool marks for each service card. */
const TOOLS = {
  /** interlocking gears — agentic systems */
  gears: (
    <>
      <circle cx="7" cy="9" r="3.4" strokeWidth="1.3" {...S} />
      <circle cx="14" cy="12" r="2.4" strokeWidth="1.3" {...S} />
      <line x1="7" y1="4.2" x2="7" y2="2.4" strokeWidth="1.3" {...S} />
      <line x1="7" y1="15.6" x2="7" y2="13.8" strokeWidth="1.3" {...S} />
    </>
  ),
  /** funnel — document pipelines */
  funnel: (
    <>
      <path d="M3 3 h14 l-5 6 v7 l-4 -2 v-5 z" strokeWidth="1.3" {...S} />
    </>
  ),
  /** plug — MCP integrations */
  plug: (
    <>
      <rect x="5" y="6" width="8" height="7" rx="1" strokeWidth="1.3" {...S} />
      <line x1="7" y1="6" x2="7" y2="3" strokeWidth="1.3" {...S} />
      <line x1="11" y1="6" x2="11" y2="3" strokeWidth="1.3" {...S} />
      <line x1="9" y1="13" x2="9" y2="17" strokeWidth="1.3" {...S} />
    </>
  ),
  /** scales — evaluation */
  scales: (
    <>
      <line x1="9" y1="3" x2="9" y2="16" strokeWidth="1.3" {...S} />
      <line x1="3" y1="6" x2="15" y2="6" strokeWidth="1.3" {...S} />
      <path d="M3 6 L1 11 h4 z" strokeWidth="1.2" {...S} />
      <path d="M15 6 L13 11 h4 z" strokeWidth="1.2" {...S} />
      <line x1="5" y1="16" x2="13" y2="16" strokeWidth="1.3" {...S} />
    </>
  ),
  /** gauge — cost engineering */
  gauge: (
    <>
      <path d="M2.5 14 a6.5 6.5 0 0 1 13 0" strokeWidth="1.3" {...S} />
      <line x1="9" y1="14" x2="13" y2="9" strokeWidth="1.3" {...S} />
      <line x1="2.5" y1="14" x2="15.5" y2="14" strokeWidth="1.3" {...S} />
    </>
  ),
} as const;

export type ToolName = keyof typeof TOOLS;

export function ToolGlyph({ name }: { name: ToolName }) {
  return (
    <svg viewBox="0 0 18 18" className="tool-glyph" aria-hidden="true" focusable="false">
      {TOOLS[name]}
    </svg>
  );
}
