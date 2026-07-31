/**
 * Hand-authored monochrome architecture diagrams, one per flagship.
 * Everything inherits currentColor so the theme toggle inverts them.
 * Arrows carry data-draw + pathLength for the stroke-draw reveal.
 * Every node maps to a claim in the card's bullets — nothing invented.
 */

function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 3 : y + h / 2 + 4}
        textAnchor="middle"
        fontSize={11.5}
        fontWeight={600}
        fill="currentColor"
      >
        {title}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 11}
          textAnchor="middle"
          fontSize={9.5}
          fill="currentColor"
          opacity={0.6}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  marker,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  marker: string;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth={1.25}
      markerEnd={`url(#${marker})`}
      data-draw
      pathLength={1}
    />
  );
}

function ArrowMarker({ id }: { id: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 8 8"
      refX={7}
      refY={4}
      markerWidth={7}
      markerHeight={7}
      orient="auto-start-reverse"
    >
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
    </marker>
  );
}

function ExecutiveAssistantDiagram() {
  return (
    <svg
      viewBox="0 0 660 200"
      className="h-auto w-full"
      role="img"
      aria-label="Flow: WhatsApp, Instagram and Messenger feed an n8n router agent, which sends routine messages to context-aware replies, priority items to human review on Telegram, and logs everything through an observer agent into Notion and PostgreSQL."
    >
      <defs>
        <ArrowMarker id="ah-ea" />
      </defs>
      <Box x={8} y={16} w={112} h={30} title="WhatsApp" />
      <Box x={8} y={58} w={112} h={30} title="Instagram" />
      <Box x={8} y={100} w={112} h={30} title="Messenger" />
      <Box x={190} y={52} w={150} h={48} title="n8n Router Agent" sub="LLM classification" />
      <Box x={410} y={14} w={150} h={40} title="Context-aware reply" sub="routine inquiries" />
      <Box x={410} y={66} w={150} h={44} title="Human review" sub="Telegram HITL" />
      <Box x={190} y={140} w={150} h={44} title="Observer agent" sub="nightly briefing" />
      <Box x={410} y={142} w={170} h={40} title="Notion · PostgreSQL" sub="interaction log" />
      <Arrow x1={120} y1={31} x2={188} y2={64} marker="ah-ea" />
      <Arrow x1={120} y1={73} x2={188} y2={76} marker="ah-ea" />
      <Arrow x1={120} y1={115} x2={188} y2={88} marker="ah-ea" />
      <Arrow x1={340} y1={64} x2={408} y2={36} marker="ah-ea" />
      <Arrow x1={340} y1={84} x2={408} y2={87} marker="ah-ea" />
      <Arrow x1={265} y1={100} x2={265} y2={138} marker="ah-ea" />
      <Arrow x1={340} y1={162} x2={408} y2={162} marker="ah-ea" />
    </svg>
  );
}

function RecruitmentJudgeDiagram() {
  return (
    <svg
      viewBox="0 0 660 150"
      className="h-auto w-full"
      role="img"
      aria-label="Flow: Google Drive and Airtable MCP servers feed a judge agent grading against a rubric with per-criterion confidence; output is graded candidates at 85% human agreement, validated against a golden set of 100 resumes with Ragas and Arize Phoenix."
    >
      <defs>
        <ArrowMarker id="ah-judge" />
      </defs>
      <Box x={8} y={20} w={150} h={34} title="Google Drive" sub="MCP server" />
      <Box x={8} y={90} w={150} h={34} title="Airtable" sub="MCP server" />
      <Box x={230} y={45} w={180} h={52} title="Judge agent" sub="rubric · per-criterion confidence" />
      <Box x={480} y={20} w={172} h={38} title="Graded candidates" sub="85% human agreement" />
      <Box x={480} y={90} w={172} h={44} title="Golden set · 100 resumes" sub="Ragas · Arize Phoenix" />
      <Arrow x1={158} y1={37} x2={228} y2={60} marker="ah-judge" />
      <Arrow x1={158} y1={107} x2={228} y2={82} marker="ah-judge" />
      <Arrow x1={410} y1={60} x2={478} y2={39} marker="ah-judge" />
      <Arrow x1={478} y1={105} x2={412} y2={85} marker="ah-judge" />
    </svg>
  );
}

function PiiRedactionDiagram() {
  return (
    <svg
      viewBox="0 0 660 150"
      className="h-auto w-full"
      role="img"
      aria-label="Flow inside a local-machine boundary: a document passes through a fine-tuned Phi-3 model that detects and redacts PII, producing redacted output. No cloud calls; nothing leaves the machine."
    >
      <defs>
        <ArrowMarker id="ah-pii" />
      </defs>
      <rect
        x={100}
        y={12}
        width={455}
        height={116}
        rx={8}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="6 4"
        opacity={0.7}
      />
      <text x={118} y={32} fontSize={10} fill="currentColor" opacity={0.7} className="font-mono">
        LOCAL MACHINE — NOTHING LEAVES
      </text>
      <Box x={120} y={60} w={110} h={36} title="Document" />
      <Box x={270} y={54} w={160} h={48} title="Fine-tuned Phi-3" sub="PII detect + redact" />
      <Box x={470} y={60} w={110} h={36} title="Redacted output" />
      <Arrow x1={230} y1={78} x2={268} y2={78} marker="ah-pii" />
      <Arrow x1={430} y1={78} x2={468} y2={78} marker="ah-pii" />
      <text
        x={330}
        y={144}
        textAnchor="middle"
        fontSize={10}
        fill="currentColor"
        opacity={0.55}
        className="font-mono"
      >
        No cloud calls · 100% data sovereignty · GDPR by design
      </text>
    </svg>
  );
}

const DIAGRAMS = [ExecutiveAssistantDiagram, RecruitmentJudgeDiagram, PiiRedactionDiagram];

/** Diagram for flagship at `index` (order fixed in profile.ts); null-safe if flagships grow. */
export function FlagshipDiagram({ index }: { index: number }) {
  const Diagram = DIAGRAMS[index];
  return Diagram ? <Diagram /> : null;
}
