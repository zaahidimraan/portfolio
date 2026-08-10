/**
 * The static cutaway house (E38): every polygon of the two-storey isometric
 * scene, rebuilt programmatically from the art-direction SVG's palette and
 * BUILD-SPEC §3's coordinates. Nothing here animates or re-renders — motion
 * (avatar, sun, glows, night) is layered on top by house.tsx.
 *
 * Painter's order: garden → ground slab/floors → ground furniture → stairs →
 * upper slab/floors → walls → windows → upper furniture → string lights.
 */

import { UPPER_H, WALL_H, box, floorPts, iso, pts, wallU, wallV, type Face } from "./iso";
import { ROOMS, type RoomKey } from "./plan";

const H = UPPER_H;

/** Render a box's three faces. */
function B({ f, className }: { f: Face[]; className?: string }) {
  return (
    <g className={className}>
      {f.map((face, i) => (
        <polygon key={i} points={face.d} fill={face.fill} />
      ))}
    </g>
  );
}

/** A flat quad on a wall or floor plane. */
function Q({ p, fill, className }: { p: [number, number][]; fill: string; className?: string }) {
  return <polygon points={pts(p)} fill={fill} className={className} />;
}

/** A window on the v=0 back wall: frame + glass (glass swaps fill at night). */
function WindowV({ u1, u2, h0, h1 }: { u1: number; u2: number; h0: number; h1: number }) {
  return (
    <g>
      <Q p={[iso(u1, 0, h0), iso(u2, 0, h0), iso(u2, 0, h1), iso(u1, 0, h1)]} fill="#8a6b45" />
      <Q
        p={[iso(u1 + 0.4, 0, h0 + 0.6), iso(u2 - 0.4, 0, h0 + 0.6), iso(u2 - 0.4, 0, h1 - 0.6), iso(u1 + 0.4, 0, h1 - 0.6)]}
        fill="#d3e8da"
        className="hs-glass"
      />
    </g>
  );
}

/** A window on the u=0 back wall. */
function WindowU({ v1, v2, h0, h1 }: { v1: number; v2: number; h0: number; h1: number }) {
  return (
    <g>
      <Q p={[iso(0, v1, h0), iso(0, v2, h0), iso(0, v2, h1), iso(0, v1, h1)]} fill="#8a6b45" />
      <Q
        p={[iso(0, v1 + 0.4, h0 + 0.6), iso(0, v2 - 0.4, h0 + 0.6), iso(0, v2 - 0.4, h1 - 0.6), iso(0, v1 + 0.4, h1 - 0.6)]}
        fill="#d3e8da"
        className="hs-glass"
      />
    </g>
  );
}

/** An interior divider wall running in v (u = const), with optional door gap. */
function DividerU({ u, v1, v2, h0, h1, gap }: { u: number; v1: number; v2: number; h0: number; h1: number; gap?: [number, number] }) {
  const spans: [number, number][] = gap ? [[v1, gap[0]], [gap[1], v2]] : [[v1, v2]];
  return (
    <g>
      {spans.filter(([a, b]) => b > a).map(([a, b], i) => (
        <g key={i}>
          <Q p={[iso(u, a, h0), iso(u, b, h0), iso(u, b, h1), iso(u, a, h1)]} fill="#a39476" />
          <Q p={[iso(u, a, h1), iso(u, b, h1), iso(u - 0.6, b, h1), iso(u - 0.6, a, h1)]} fill="#f1ddb5" />
        </g>
      ))}
    </g>
  );
}

/* ---------------- garden ---------------- */

function Tree({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={30 * s} ry={38 * s} fill="#87a06b" />
      <ellipse cx={cx - 22 * s} cy={cy + 16 * s} rx={22 * s} ry={26 * s} fill="#7a9460" />
      <ellipse cx={cx + 20 * s} cy={cy + 20 * s} rx={18 * s} ry={22 * s} fill="#7a9460" />
    </g>
  );
}

export function Garden() {
  return (
    <g>
      {/* the lawn reaches behind the house and the shadow hugs the slab, so
          the house sits IN the garden instead of floating over it (E46) */}
      <ellipse cx="54" cy="165" rx="480" ry="178" fill="#cec79f" opacity="0.9" />
      <ellipse cx="54" cy="160" rx="335" ry="100" fill="rgba(60,80,40,.3)" />
      <Tree cx={-330} cy={20} s={1.2} />
      <Tree cx={-255} cy={-60} s={0.9} />
      <Tree cx={470} cy={-15} s={1.1} />
      <Tree cx={535} cy={120} s={1.3} />
      <Tree cx={425} cy={-95} s={0.8} />
      {/* stepping-stone path from the hall's front corner out to the garden */}
      <path d="M228.6,126.9 Q145,306 111.6,266.4" fill="none" stroke="#8a8264" strokeWidth="1.2" />
      {[[204.7, 175.8], [180.3, 219.3], [157.6, 251.5], [138.2, 269.5], [122.8, 273.5]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="2.2" fill="#fff" opacity="0.85" />
      ))}
    </g>
  );
}

/* ---------------- the house ---------------- */

const groundRooms = ROOMS.filter((r) => r.h === 0);
const upperRooms = ROOMS.filter((r) => r.h === H);

function Stairs() {
  // Eight shallow treads, alternating shades so each step reads as a step
  // rather than one solid mass (E46); the run tops out at the slab edge.
  const steps = [];
  const N = 8;
  const vBottom = 21.2;
  const dv = (vBottom - 13.6) / N;
  for (let i = 0; i < N; i++) {
    const v1 = vBottom - (i + 1) * dv;
    steps.push(
      <B key={i} f={box(15.5, v1, 19.5, v1 + dv, 0, ((i + 1) * H) / N, i % 2 ? "#c9a06a" : "#b98f57")} />,
    );
  }
  return <g>{steps}</g>;
}

function BookSpines() {
  const colors = ["#c95f4f", "#7fa9a3", "#5f8f7a", "#b56a9f", "#e7c14e", "#cf7f4f", "#5b7fb5"];
  const rows: React.ReactNode[] = [];
  for (let row = 0; row < 2; row++) {
    const h0 = 2.2 + row * 2.7;
    for (let i = 0; i < 8; i++) {
      const u1 = 32 + i * 0.85;
      rows.push(
        <Q
          key={`${row}-${i}`}
          p={[iso(u1, 1.8, h0), iso(u1 + 0.62, 1.8, h0), iso(u1 + 0.62, 1.8, h0 + 1.9), iso(u1, 1.8, h0 + 1.9)]}
          fill={colors[(i + row * 3) % colors.length]}
        />,
      );
    }
  }
  return <g>{rows}</g>;
}

function RackLeds() {
  const cells: React.ReactNode[] = [];
  const colors = ["#58d08a", "#f2c14e", "#25303f"];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const u1 = 35.7 + col * 0.5;
      const h0 = H + 1 + row * 0.9;
      cells.push(
        <Q
          key={`${row}-${col}`}
          p={[iso(u1, 3.6, h0), iso(u1 + 0.32, 3.6, h0), iso(u1 + 0.32, 3.6, h0 + 0.28), iso(u1, 3.6, h0 + 0.28)]}
          fill={colors[(row * 6 + col) % 3]}
          className={(row * 6 + col) % 3 !== 2 ? "hs-led" : undefined}
        />,
      );
    }
  }
  return <g>{cells}</g>;
}

export function HouseShell() {
  return (
    <g>
      {/* plot slab */}
      <Q p={[iso(40, 0, 0), iso(40, 0, -1.4), iso(40, 28, -1.4), iso(40, 28, 0)]} fill="#897a61" />
      <Q p={[iso(0, 28, 0), iso(40, 28, 0), iso(40, 28, -1.4), iso(0, 28, -1.4)]} fill="#ab9979" />
      <Q p={[iso(0, 0, 0), iso(40, 0, 0), iso(40, 28, 0), iso(0, 28, 0)]} fill="#cebc99" />

      {/* ground back walls */}
      <g className="i-shell">
        <B f={wallV(0, 40, 0, 0, WALL_H, "#cfc1a1", "#f5e6c4")} />
        <B f={wallU(0, 28, 0, 0, WALL_H, "#a3967a", "#f1e0bc")} />
        <WindowV u1={2.6} u2={8.4} h0={3.4} h1={9.2} />
        <WindowV u1={20} u2={26} h0={3.4} h1={9.2} />
        <WindowU v1={18} v2={24} h0={3.4} h1={8.4} />
      </g>

      {/* ground floors */}
      {groundRooms.map((r) => (
        <polygon key={r.key} points={floorPts(r.u1, r.v1, r.u2, r.v2, 0.02)} fill={r.floor} className={`hs-floor hs-floor-${r.key}`} />
      ))}

      {/* ground furniture */}
      <g className="i-furn">
        {/* kitchen */}
        <B f={box(0.8, 0.6, 11, 2.8, 0, 4, "#ebac6c")} />
        <Q p={[iso(2, 1, 4.04), iso(3.8, 1, 4.04), iso(3.8, 2.4, 4.04), iso(2, 2.4, 4.04)]} fill="#c8ccd2" />
        <Q p={[iso(5, 1.2, 4.04), iso(6, 1.2, 4.04), iso(6, 2.2, 4.04), iso(5, 2.2, 4.04)]} fill="#3a3a3a" />
        <Q p={[iso(6.6, 1.2, 4.04), iso(7.6, 1.2, 4.04), iso(7.6, 2.2, 4.04), iso(6.6, 2.2, 4.04)]} fill="#3a3a3a" />
        <B f={box(11.5, 0.6, 13.6, 2.8, 0, 8, "#dde0e5")} />
        <B f={box(6, 7.5, 10, 10.5, 0, 3.2, "#d48c61")} />
        <B f={box(4.6, 8.3, 5.6, 9.3, 0, 2, "#e9c760")} />
        <B f={box(10.6, 8.3, 11.6, 9.3, 0, 2, "#e9c760")} />

        {/* drawing room */}
        <B f={box(18.5, 0.3, 27.5, 1.2, 0, 1, "#8c6036")} />
        <B f={box(19, 0.35, 27, 0.9, 1, 6.2, "#3f4247")} />
        <Q p={[iso(19.4, 0.9, 1.6), iso(26.6, 0.9, 1.6), iso(26.6, 0.9, 5.6), iso(19.4, 0.9, 5.6)]} fill="#485a70" className="hs-tv" />
        <Q p={[iso(20.5, 5.8, 0.03), iso(25.5, 5.8, 0.03), iso(25.5, 9.4, 0.03), iso(20.5, 9.4, 0.03)]} fill="#caa3b8" />
        <B f={box(21.5, 6.4, 24.5, 8.1, 0, 1.6, "#ce8261")} />
        <B f={box(19, 10.2, 26.5, 12.8, 0, 2.6, "#eb8c6f")} />
        <B f={box(19, 12.6, 26.5, 13.5, 0, 4.6, "#dd7a5f")} />
        <B f={box(28, 1.6, 29.2, 2.8, 0, 2.6, "#ab6343")} />
        <ellipse cx={iso(28.6, 2.2, 4.6)[0]} cy={iso(28.6, 2.2, 4.6)[1]} rx="7" ry="8.5" fill="#6c945a" />

        {/* library */}
        <B f={box(31.6, 0.6, 39.4, 1.8, 0, 9, "#8c6036")} />
        <BookSpines />
        <B f={box(35, 6, 37.6, 8.4, 0, 2.8, "#6f9a87")} />
        <B f={box(37.9, 6.6, 38.3, 7, 0, 5, "#483d31")} />
        <B f={box(37.5, 6.2, 38.7, 7.4, 5, 6.4, "#f3c760")} />

        {/* garage / workshop */}
        <B f={box(0.8, 15, 3, 25, 0, 4, "#967a58")} />
        <Q p={[iso(0.04, 16, 5), iso(0.04, 23, 5), iso(0.04, 23, 9), iso(0.04, 16, 9)]} fill="#c9a06a" />
        {[17, 18.6, 20.2, 21.8].map((v) => (
          <Q key={v} p={[iso(0.05, v, 5.8), iso(0.05, v + 0.5, 5.8), iso(0.05, v + 0.5, 7.8), iso(0.05, v, 7.8)]} fill="#7a5c38" />
        ))}
        <B f={box(9.5, 22.5, 12.2, 25.2, 0, 2.4, "#c4a442")} />
        <B f={box(10, 20.4, 12, 22.2, 0, 1.8, "#e9c760")} />
        <B f={box(9.8, 23, 11.4, 24.4, 2.4, 4.2, "#ddb54e")} />

        {/* hall rug */}
        <Q p={[iso(21.5, 17, 0.03), iso(28.5, 17, 0.03), iso(28.5, 24, 0.03), iso(21.5, 24, 0.03)]} fill="#c94f43" />

        {/* balcony / garden deck */}
        <B f={box(33.5, 19.5, 36.5, 21.8, 0, 1.8, "#ceaa79")} />
        <B f={box(31, 24.5, 33, 26.5, 0, 2.2, "#755b3b")} />
        <ellipse cx={iso(32, 25.5, 3.6)[0]} cy={iso(32, 25.5, 3.6)[1]} rx="8" ry="9" fill="#6c945a" />
        <B f={box(37.5, 24.5, 39.5, 26.5, 0, 2.2, "#755b3b")} />
        <ellipse cx={iso(38.5, 25.5, 3.6)[0]} cy={iso(38.5, 25.5, 3.6)[1]} rx="8" ry="9" fill="#8cb679" />
        <B f={box(31.2, 26.6, 31.7, 27.1, 0, 4.5, "#5e492f")} />
      </g>

      <Stairs />

      {/* interior ground dividers — LOW walls (E46: the rooms stay visible),
          with door gaps where he walks */}
      <DividerU u={14.5} v1={0} v2={14} h0={0} h1={2.8} gap={[5.8, 8.5]} />
      <DividerU u={30.5} v1={0} v2={10} h0={0} h1={2.8} gap={[3.8, 6.5]} />
      <DividerU u={14.5} v1={14} v2={28} h0={0} h1={2.8} gap={[18.8, 21.5]} />
      <DividerU u={30} v1={14} v2={28} h0={0} h1={1.8} gap={[18.8, 21.5]} />

      {/* upper slab: fascia + top (the corridor the avatar walks) */}
      <g className="i-shell">
        <Q p={[iso(40, 0, WALL_H), iso(40, 14.6, WALL_H), iso(40, 14.6, H), iso(40, 0, H)]} fill="#9e9076" />
        <Q p={[iso(0, 14.6, WALL_H), iso(40, 14.6, WALL_H), iso(40, 14.6, H), iso(0, 14.6, H)]} fill="#c5b494" />
        <Q p={[iso(0, 0, H), iso(40, 0, H), iso(40, 14.6, H), iso(0, 14.6, H)]} fill="#ead8b6" />
      </g>

      {/* upper floors */}
      {upperRooms.map((r) => (
        <polygon key={r.key} points={floorPts(r.u1, r.v1, r.u2, r.v2, H + 0.02)} fill={r.floor} className={`hs-floor hs-floor-${r.key}`} />
      ))}

      {/* upper back walls + windows */}
      <g className="i-shell">
        <B f={wallV(0, 40, 0, H, H + 8.8, "#cfc1a1", "#f5e6c4")} />
        <B f={wallU(0, 14.6, 0, H, H + 8.8, "#a3967a", "#f1e0bc")} />
        <WindowV u1={3} u2={8.8} h0={H + 3} h1={H + 7.8} />
        <WindowV u1={26} u2={31.4} h0={H + 3} h1={H + 7.8} />
      </g>

      {/* upper furniture */}
      <g className="i-furn">
        {/* bedroom: bed 1,4→7.5 with mattress, pillow, blanket */}
        <B f={box(1, 4, 7.5, 9.6, H, H + 2, "#ae7f52")} />
        <B f={box(1.3, 4.3, 7.2, 9.3, H + 2, H + 2.6, "#f0f4f6")} />
        <B f={box(1.5, 4.6, 2.9, 6.4, H + 2.6, H + 3.1, "#f8f2e5")} />
        <B f={box(3.4, 4.3, 7.2, 9.3, H + 2.6, H + 3, "#6a9ac8")} />
        <B f={box(12.5, 0.6, 15.5, 2.6, H, H + 7, "#8c6036")} />
        <B f={box(8.4, 4, 9.8, 5.4, H, H + 2, "#ae7f52")} />
        <B f={box(8.7, 4.3, 9.5, 5.1, H + 2, H + 3.1, "#f3c760")} />
        <Q p={[iso(9, 6.5, H + 0.03), iso(13.5, 6.5, H + 0.03), iso(13.5, 9.5, H + 0.03), iso(9, 9.5, H + 0.03)]} fill="#a8d4de" />

        {/* bath */}
        <B f={box(17.6, 0.8, 19.9, 5.8, H, H + 2, "#f0f4f6")} />
        <Q p={[iso(17.9, 1.1, H + 2.02), iso(19.6, 1.1, H + 2.02), iso(19.6, 5.5, H + 2.02), iso(17.9, 5.5, H + 2.02)]} fill="#a8d4de" />
        <B f={box(22, 0.8, 23.4, 2.2, H, H + 2.8, "#dde0e5")} />
        <Q p={[iso(20.5, 6.5, H + 0.03), iso(22.8, 6.5, H + 0.03), iso(22.8, 8.2, H + 0.03), iso(20.5, 8.2, H + 0.03)]} fill="#e97f5f" />

        {/* office (t6): desk, three monitors facing the chair, keyboard, chair */}
        <B f={box(25.6, 0.8, 33.6, 3.4, H, H + 2.8, "#c08e60")} />
        <B f={box(26.1, 1.3, 28.3, 1.7, H + 3.1, H + 4.8, "#24262b")} />
        <Q p={[iso(26.3, 1.72, H + 3.3), iso(28.1, 1.72, H + 3.3), iso(28.1, 1.72, H + 4.6), iso(26.3, 1.72, H + 4.6)]} fill="#5a86b8" className="hs-screen" />
        <B f={box(28.8, 1.3, 31.4, 1.7, H + 3.1, H + 5.1, "#24262b")} />
        <Q p={[iso(29, 1.72, H + 3.3), iso(31.2, 1.72, H + 3.3), iso(31.2, 1.72, H + 4.9), iso(29, 1.72, H + 4.9)]} fill="#6a9ac8" className="hs-screen" />
        <B f={box(31.9, 1.3, 33.2, 1.7, H + 3.1, H + 5.5, "#24262b")} />
        <Q p={[iso(32.05, 1.72, H + 3.3), iso(33.05, 1.72, H + 3.3), iso(33.05, 1.72, H + 5.3), iso(32.05, 1.72, H + 5.3)]} fill="#58d08a" className="hs-screen" />
        <B f={box(28.7, 2.4, 30.7, 3, H + 2.82, H + 3, "#434750")} />
        <B f={box(31.2, 2.5, 31.7, 2.95, H + 2.82, H + 3, "#5c6270")} />
        <B f={box(26.8, 2.5, 27.3, 3, H + 2.82, H + 3.4, "#c95f4f")} />
        <B f={box(29, 4.9, 30.8, 6.4, H + 1.5, H + 1.9, "#8b3631")} />
        <B f={box(29, 6.2, 30.8, 6.6, H + 1.9, H + 4.4, "#ac534e")} />

        {/* the half divider paints before the server furniture, which sits
            nearer the camera (spec t6/§3: wall at u34, v4.2–7 only) */}
        <DividerU u={34.5} v1={4.2} v2={7} h0={H} h1={H + 2.6} />

        {/* server nook: rack + CRT side desk, cabled to the office desk */}
        <path
          d={`M${iso(33.6, 2.4, H)[0]},${iso(33.6, 2.4, H)[1]} L${iso(35.4, 2.4, H)[0]},${iso(35.4, 2.4, H)[1]}`}
          stroke="#1b2b22"
          strokeWidth="1.4"
          fill="none"
        />
        <B f={box(35.4, 0.8, 38.6, 3.6, H, H + 6.8, "#2f3642")} className="hs-rack" />
        <RackLeds />
        <B f={box(35.4, 6, 38.6, 8.6, H, H + 2.2, "#ae7f52")} />
        <B f={box(35.8, 6.2, 38.4, 7.8, H + 2.2, H + 4.7, "#4b5360")} />
        <Q
          p={[iso(36, 7.82, H + 2.45), iso(38.2, 7.82, H + 2.45), iso(38.2, 7.82, H + 4.45), iso(36, 7.82, H + 4.45)]}
          fill="#0d2b1a"
          className="hs-crt"
        />
      </g>

      {/* upper interior dividers — low too (E46) */}
      <DividerU u={16.5} v1={0} v2={10} h0={H} h1={H + 2.6} />
      <DividerU u={24.5} v1={0} v2={10} h0={H} h1={H + 2.6} />

      {/* string lights: balcony post up to the slab corner, lit at night */}
      <path
        d={`M${iso(31.4, 26.8, 4.5)[0]},${iso(31.4, 26.8, 4.5)[1]} Q${iso(36, 20, 6)[0]},${iso(36, 20, 6)[1]} ${iso(40, 14.6, H)[0]},${iso(40, 14.6, H)[1]}`}
        fill="none"
        stroke="#4a4536"
        strokeWidth="1"
        opacity="0.6"
      />
      {[0.15, 0.35, 0.55, 0.75, 0.92].map((t) => {
        const a = iso(31.4, 26.8, 4.5);
        const c = iso(36, 20, 6);
        const b = iso(40, 14.6, H);
        const x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0];
        const y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1] + 2;
        return <circle key={t} cx={x} cy={y} r="1.8" fill="#f2c14e" className="hs-bulb" />;
      })}
    </g>
  );
}

/* ---------------- leader-line labels (the infographic look) ---------------- */

const LABELS: { key: RoomKey; text: string; ax: number; ay: number; side: "l" | "r"; ty: number }[] = [
  { key: "bedroom", text: "BEDROOM", ...anchor(4, 8, H + 4), side: "l", ty: -144.5 },
  { key: "kitchen", text: "KITCHEN", ...anchor(4, 4, 6), side: "l", ty: -48.5 },
  { key: "garage", text: "GARAGE / WORKSHOP", ...anchor(4, 18, 4), side: "l", ty: 69.5 },
  { key: "bath", text: "BATHROOM", ...anchor(20.5, 3, H + 4), side: "r", ty: -126.5 },
  { key: "office", text: "OFFICE", ...anchor(29, 2, H + 5), side: "r", ty: -74.5 },
  { key: "server", text: "SERVER", ...anchor(37, 2, H + 5), side: "r", ty: -20.5 },
  { key: "library", text: "LIBRARY", ...anchor(36, 4, 6), side: "r", ty: 91.5 },
  { key: "drawing", text: "DRAWING ROOM", ...anchor(24, 11, 3), side: "r", ty: 121.5 },
  { key: "balcony", text: "BALCONY / GARDEN", ...anchor(35, 22, 2), side: "r", ty: 209.5 },
];

function anchor(u: number, v: number, h: number): { ax: number; ay: number } {
  const [ax, ay] = iso(u, v, h);
  return { ax, ay };
}

/** Leader-line labels, revealed one at a time as rooms are hovered (E46). */
export function Labels({ show }: { show: RoomKey | null }) {
  return (
    <g className="hs-labels">
      {LABELS.map((l) => {
        const tx = l.side === "l" ? -268 : 452;
        const lx = l.side === "l" ? -262 : 446;
        return (
          <g key={l.key} className={`hs-label${show === l.key ? " hs-label-on" : ""}`}>
            <line x1={l.ax} y1={l.ay} x2={lx} y2={l.ty + 3.5} stroke="currentColor" strokeWidth="1" opacity="0.45" />
            <circle cx={l.ax} cy={l.ay} r="2.6" fill="currentColor" />
            <text x={tx} y={l.ty} fontSize="10.5" letterSpacing="1.2" textAnchor={l.side === "l" ? "end" : "start"} fill="currentColor">
              {l.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}
