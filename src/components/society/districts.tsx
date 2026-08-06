"use client";

import { useDistrictChrome } from "./town-context";

/**
 * One working district per section (TWN-2).
 *
 * Each band sits at the foot of its section, never under body text (D4), and
 * only animates while near the viewport (D2). Every scene shares the same
 * ground line at y=64 so the town reads as one continuous place (TWN-3.1).
 *
 * All geometry is inline SVG on `currentColor`: no images, no libraries, and
 * the whole town inverts with the theme for free.
 */

const S = { stroke: "currentColor", fill: "none", strokeLinecap: "round" as const };
const GROUND = 64;

function Ground() {
  return <line x1="0" y1={GROUND} x2="1200" y2={GROUND} strokeWidth="1" opacity="0.35" {...S} />;
}

/** Reusable walking figure, scaled into a district. */
function Walker({ x, scale = 1, dur = 26, delay = 0, travel = 180 }: {
  x: number; scale?: number; dur?: number; delay?: number; travel?: number;
}) {
  return (
    <g
      className="d-walker"
      style={{
        ["--d-travel" as string]: `${travel}px`,
        ["--d-dur" as string]: `${dur}s`,
        ["--d-delay" as string]: `${delay}s`,
      }}
      transform={`translate(${x} ${GROUND}) scale(${scale})`}
    >
      <circle cx="0" cy="-30" r="4" fill="currentColor" />
      <line x1="0" y1="-26" x2="0" y2="-13" strokeWidth="2.3" {...S} />
      <g className="d-limb d-arm-a"><line x1="0" y1="-23" x2="0" y2="-16" strokeWidth="1.8" {...S} /></g>
      <g className="d-limb d-arm-b"><line x1="0" y1="-23" x2="0" y2="-16" strokeWidth="1.8" {...S} /></g>
      <g className="d-limb d-leg-a"><line x1="0" y1="-13" x2="0" y2="0" strokeWidth="2.1" {...S} /></g>
      <g className="d-limb d-leg-b"><line x1="0" y1="-13" x2="0" y2="0" strokeWidth="2.1" {...S} /></g>
    </g>
  );
}

function Band({ scene, children }: { scene: string; children: React.ReactNode }) {
  const chrome = useDistrictChrome();
  return (
    <div {...chrome(scene)}>
      <svg viewBox="0 0 1200 80" preserveAspectRatio="xMidYMax meet" className="district-svg">
        {children}
        <Ground />
      </svg>
    </div>
  );
}

/** Arrivals walking in past the signpost. */
export function GateDistrict() {
  return (
    <Band scene="gate">
      <line x1="120" y1={GROUND} x2="120" y2="26" strokeWidth="2" {...S} />
      <path d="M120 30 h46 l-7 6 h-39 z" strokeWidth="1.4" {...S} />
      <path d="M120 44 h-40 l7 6 h33 z" strokeWidth="1.4" {...S} />
      <Walker x={210} dur={30} travel={300} />
      <Walker x={520} scale={0.8} dur={38} delay={-11} travel={260} />
      <g className="d-bird" style={{ ["--d-dur" as string]: "34s" }}>
        <path d="M0 0 q5 -5 10 0 q5 -5 10 0" strokeWidth="1.3" {...S} />
      </g>
    </Band>
  );
}

/** Clerks carrying ledgers to a tally board. */
export function RecordsDistrict() {
  return (
    <Band scene="records">
      <rect x="880" y="18" width="150" height="46" strokeWidth="1.5" {...S} />
      <line x1="898" y1="30" x2="1012" y2="30" strokeWidth="1.1" opacity="0.6" {...S} />
      <line x1="898" y1="40" x2="990" y2="40" strokeWidth="1.1" opacity="0.6" {...S} />
      <g className="d-tally">
        <line x1="898" y1="50" x2="960" y2="50" strokeWidth="2" {...S} />
      </g>
      <Walker x={180} dur={34} travel={620} />
      {/* clerk carrying a ledger */}
      <g transform={`translate(760 ${GROUND})`}>
        <circle cx="0" cy="-30" r="4" fill="currentColor" />
        <line x1="0" y1="-26" x2="0" y2="-13" strokeWidth="2.3" {...S} />
        <line x1="0" y1="-13" x2="-5" y2="0" strokeWidth="2.1" {...S} />
        <line x1="0" y1="-13" x2="5" y2="0" strokeWidth="2.1" {...S} />
        <g className="d-carry">
          <line x1="0" y1="-23" x2="11" y2="-20" strokeWidth="1.8" {...S} />
          <rect x="9" y="-26" width="11" height="9" strokeWidth="1.3" {...S} />
        </g>
      </g>
    </Band>
  );
}

/** Three workshop huts, machines turning, a crane at work. */
export function WorkshopsDistrict() {
  return (
    <Band scene="workshops">
      {[80, 250, 420].map((x, i) => (
        <g key={x}>
          <path d={`M${x} ${GROUND} V34 l26 -14 l26 14 v30 z`} strokeWidth="1.5" {...S} />
          <rect x={x + 18} y={GROUND - 18} width="16" height="18" strokeWidth="1.2" {...S} />
          <g className="d-cog" style={{ ["--d-delay" as string]: `${-i * 0.7}s` }}>
            <circle cx={x + 26} cy="30" r="5" strokeWidth="1.3" {...S} />
            <line x1={x + 26} y1="23" x2={x + 26} y2="37" strokeWidth="1.1" {...S} />
            <line x1={x + 19} y1="30" x2={x + 33} y2="30" strokeWidth="1.1" {...S} />
          </g>
        </g>
      ))}
      {/* crane raising a load */}
      <line x1="700" y1={GROUND} x2="700" y2="12" strokeWidth="2" {...S} />
      <line x1="700" y1="16" x2="790" y2="16" strokeWidth="2" {...S} />
      <line x1="770" y1="16" x2="770" y2="34" strokeWidth="1" {...S} />
      <g className="d-load"><rect x="762" y="34" width="16" height="12" strokeWidth="1.3" {...S} /></g>
      {/* builder hammering */}
      <g transform={`translate(880 ${GROUND})`}>
        <path d="M-4 -34 a4 4 0 0 1 8 0 z" fill="currentColor" />
        <circle cx="0" cy="-30" r="3.4" fill="currentColor" />
        <line x1="0" y1="-27" x2="0" y2="-13" strokeWidth="2.2" {...S} />
        <line x1="0" y1="-13" x2="-5" y2="0" strokeWidth="2" {...S} />
        <line x1="0" y1="-13" x2="5" y2="0" strokeWidth="2" {...S} />
        <g className="d-hammer">
          <line x1="0" y1="-24" x2="12" y2="-30" strokeWidth="1.9" {...S} />
          <line x1="9" y1="-28" x2="18" y2="-33" strokeWidth="3.2" {...S} />
        </g>
      </g>
      <Walker x={1000} scale={0.85} dur={30} delay={-6} travel={140} />
    </Band>
  );
}

/** Travellers passing milestones along the road. */
export function RoadDistrict() {
  return (
    <Band scene="road">
      {[120, 340, 560, 780, 1000].map((x) => (
        <g key={x}>
          <line x1={x} y1={GROUND} x2={x} y2={GROUND - 14} strokeWidth="1.6" {...S} />
          <circle cx={x} cy={GROUND - 17} r="2.4" fill="currentColor" opacity="0.7" />
        </g>
      ))}
      <Walker x={60} dur={40} travel={980} />
      <Walker x={400} scale={0.75} dur={52} delay={-19} travel={700} />
      <Walker x={880} scale={0.6} dur={64} delay={-31} travel={260} />
    </Band>
  );
}

/** A figure racking tools. */
export function ToolshedDistrict() {
  return (
    <Band scene="toolshed">
      <path d="M60 64 V30 L200 22 v42 z" strokeWidth="1.5" {...S} />
      <line x1="78" y1="38" x2="182" y2="33" strokeWidth="1.1" opacity="0.6" {...S} />
      {[92, 118, 144, 170].map((x, i) => (
        <line
          key={x}
          x1={x}
          y1="38"
          x2={x}
          y2="50"
          strokeWidth="1.4"
          className="d-tool"
          style={{ ["--d-delay" as string]: `${-i * 0.9}s` }}
          {...S}
        />
      ))}
      <g transform={`translate(250 ${GROUND})`}>
        <circle cx="0" cy="-30" r="4" fill="currentColor" />
        <line x1="0" y1="-26" x2="0" y2="-13" strokeWidth="2.3" {...S} />
        <line x1="0" y1="-13" x2="-5" y2="0" strokeWidth="2.1" {...S} />
        <line x1="0" y1="-13" x2="5" y2="0" strokeWidth="2.1" {...S} />
        <g className="d-reach"><line x1="0" y1="-23" x2="-14" y2="-30" strokeWidth="1.8" {...S} /></g>
      </g>
      <Walker x={700} scale={0.8} dur={36} delay={-14} travel={420} />
    </Band>
  );
}

/** A reader on a ladder, shelving. */
export function LibraryDistrict() {
  return (
    <Band scene="library">
      <rect x="820" y="16" width="230" height="48" strokeWidth="1.5" {...S} />
      {[26, 40, 54].map((y) => (
        <line key={y} x1="820" y1={y} x2="1050" y2={y} strokeWidth="1" opacity="0.5" {...S} />
      ))}
      {[840, 856, 872, 900, 916, 950, 966, 982, 1020].map((x, i) => (
        <line
          key={x}
          x1={x}
          y1={i % 2 ? 28 : 42}
          x2={x}
          y2={i % 2 ? 38 : 52}
          strokeWidth="2.4"
          opacity="0.75"
          {...S}
        />
      ))}
      {/* ladder + reader */}
      <line x1="770" y1={GROUND} x2="782" y2="20" strokeWidth="1.5" {...S} />
      <line x1="790" y1={GROUND} x2="802" y2="20" strokeWidth="1.5" {...S} />
      {[30, 42, 54].map((y) => (
        <line key={y} x1={776 + (64 - y) * 0.28} y1={y} x2={796 + (64 - y) * 0.28} y2={y} strokeWidth="1" {...S} />
      ))}
      <g className="d-climb" transform="translate(786 34)">
        <circle cx="0" cy="-14" r="3.6" fill="currentColor" />
        <line x1="0" y1="-10" x2="0" y2="2" strokeWidth="2.1" {...S} />
        <line x1="0" y1="2" x2="-5" y2="12" strokeWidth="1.9" {...S} />
        <line x1="0" y1="2" x2="5" y2="12" strokeWidth="1.9" {...S} />
        <g className="d-shelve"><line x1="0" y1="-7" x2="13" y2="-11" strokeWidth="1.7" {...S} /></g>
      </g>
      <Walker x={200} dur={44} travel={480} />
    </Band>
  );
}

/** Operator at a telegraph key; pulses run down the wire. */
export function TelegraphDistrict() {
  return (
    <Band scene="telegraph">
      <path d={`M140 ${GROUND} L170 14 L200 ${GROUND}`} strokeWidth="1.6" {...S} />
      <line x1="152" y1="38" x2="188" y2="38" strokeWidth="1.3" {...S} />
      <path d="M196 10 a12 12 0 0 1 10 10" strokeWidth="1.3" {...S} />
      <path d="M200 4 a19 19 0 0 1 16 16" strokeWidth="1.1" opacity="0.6" {...S} />
      {/* the wire */}
      <path id="wire" d="M200 26 Q560 46 1020 26" strokeWidth="1.1" opacity="0.5" {...S} />
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          r="3"
          fill="currentColor"
          className="d-pulse"
          style={{ ["--d-delay" as string]: `${-i * 1.4}s` }}
        />
      ))}
      {/* operator at the key */}
      <g transform={`translate(300 ${GROUND})`}>
        <line x1="-16" y1="-10" x2="16" y2="-10" strokeWidth="1.6" {...S} />
        <line x1="-12" y1="-10" x2="-12" y2="0" strokeWidth="1.3" {...S} />
        <line x1="12" y1="-10" x2="12" y2="0" strokeWidth="1.3" {...S} />
        <circle cx="-4" cy="-34" r="4" fill="currentColor" />
        <line x1="-4" y1="-30" x2="-4" y2="-18" strokeWidth="2.3" {...S} />
        <g className="d-key"><line x1="-4" y1="-26" x2="8" y2="-14" strokeWidth="1.8" {...S} /></g>
      </g>
      <Walker x={620} scale={0.8} dur={40} delay={-17} travel={340} />
    </Band>
  );
}

/** The signpost, a postbox, someone posting a letter. */
export function TownHallDistrict() {
  return (
    <Band scene="hall">
      <path d={`M900 ${GROUND} V30 h150 v34 z`} strokeWidth="1.5" {...S} />
      <path d="M894 30 L975 12 L1056 30" strokeWidth="1.5" {...S} />
      {[920, 950, 980, 1010].map((x) => (
        <line key={x} x1={x} y1={GROUND} x2={x} y2="36" strokeWidth="1.2" opacity="0.6" {...S} />
      ))}
      {/* postbox */}
      <rect x="700" y="38" width="18" height="26" rx="8" strokeWidth="1.5" {...S} />
      <line x1="705" y1="45" x2="713" y2="45" strokeWidth="1.4" {...S} />
      {/* someone posting a letter */}
      <g transform={`translate(660 ${GROUND})`}>
        <circle cx="0" cy="-30" r="4" fill="currentColor" />
        <line x1="0" y1="-26" x2="0" y2="-13" strokeWidth="2.3" {...S} />
        <line x1="0" y1="-13" x2="-5" y2="0" strokeWidth="2.1" {...S} />
        <line x1="0" y1="-13" x2="5" y2="0" strokeWidth="2.1" {...S} />
        <g className="d-post">
          <line x1="0" y1="-23" x2="16" y2="-24" strokeWidth="1.8" {...S} />
          <rect x="14" y="-28" width="9" height="7" strokeWidth="1.2" {...S} />
        </g>
      </g>
      <Walker x={120} dur={36} travel={460} />
      <Walker x={420} scale={0.7} dur={48} delay={-22} travel={200} />
    </Band>
  );
}

export const DISTRICT_SCENES = {
  gate: GateDistrict,
  records: RecordsDistrict,
  workshops: WorkshopsDistrict,
  road: RoadDistrict,
  toolshed: ToolshedDistrict,
  library: LibraryDistrict,
  telegraph: TelegraphDistrict,
  hall: TownHallDistrict,
} as const;

export type DistrictName = keyof typeof DISTRICT_SCENES;

export function District({ name }: { name: DistrictName }) {
  const Scene = DISTRICT_SCENES[name];
  return <Scene />;
}
