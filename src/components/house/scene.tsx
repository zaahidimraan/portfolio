/**
 * The cutaway house as a DISPLAY LIST (E48).
 *
 * Every solid is a primitive in plot space — box, wall panel, flat quad,
 * ellipse blob, or a custom draw — and the renderer projects the whole list
 * for a camera angle (0/90/180/270°), depth-sorting per angle so paint order
 * is always correct. All four exterior walls exist; only the two FACING AWAY
 * from the camera are drawn, so the cutaway follows the orbit. Furniture
 * casts a soft contact shadow, which keeps everything visually grounded.
 *
 * Nothing here animates — house.tsx layers the living parts on top.
 */

import { UPPER_H, WALL_H, iso, makeProj, mapDir, mapUV, pts, shade, type Proj, type Rot } from "./iso";
import { ROOMS, type RoomKey } from "./plan";

const H = UPPER_H;
const S = 9;

type P2 = { u: number; v: number };

type Prim =
  | { t: "box"; r: [number, number, number, number]; h0: number; h1: number; c: string; cls?: string; noShadow?: boolean }
  | { t: "blob"; u: number; v: number; h: number; rx: number; ry: number; c: string }
  | { t: "panel"; a: P2; b: P2; h0: number; h1: number; c: string; top?: string }
  | { t: "cust"; u: number; v: number; bias?: number; render: (p: Proj) => React.ReactNode };

const box = (
  r: [number, number, number, number], h0: number, h1: number, c: string,
  extra?: Partial<Extract<Prim, { t: "box" }>>,
): Prim => ({ t: "box", r, h0, h1, c, ...extra });

/* ================= the furniture, in plot space ================= */

const GROUND_RUGS: { r: [number, number, number, number]; c: string }[] = [
  { r: [20.5, 5.8, 25.5, 9.4], c: "#caa3b8" },
  { r: [21.5, 17, 28.5, 24], c: "#c94f43" },
];

const GROUND: Prim[] = [
  // kitchen
  box([0.8, 0.6, 11, 2.8], 0, 4, "#ebac6c"),
  {
    t: "cust", u: 11, v: 2.8, bias: 0.6,
    render: (p) => (
      <g>
        <polygon points={pts([p(2, 1, 4.04), p(3.8, 1, 4.04), p(3.8, 2.4, 4.04), p(2, 2.4, 4.04)])} fill="#c8ccd2" />
        <polygon points={pts([p(5, 1.2, 4.04), p(6, 1.2, 4.04), p(6, 2.2, 4.04), p(5, 2.2, 4.04)])} fill="#3a3a3a" />
        <polygon points={pts([p(6.6, 1.2, 4.04), p(7.6, 1.2, 4.04), p(7.6, 2.2, 4.04), p(6.6, 2.2, 4.04)])} fill="#3a3a3a" />
      </g>
    ),
  },
  box([11.5, 0.6, 13.6, 2.8], 0, 8, "#dde0e5"),
  box([6, 7.5, 10, 10.5], 0, 3.2, "#d48c61"),
  box([4.6, 8.3, 5.6, 9.3], 0, 2, "#e9c760"),
  box([10.6, 8.3, 11.6, 9.3], 0, 2, "#e9c760"),

  // drawing room
  box([18.5, 0.3, 27.5, 1.2], 0, 1, "#8c6036"),
  box([19, 0.35, 27, 0.9], 1, 6.2, "#3f4247", { noShadow: true }),
  {
    t: "cust", u: 27.5, v: 1.2, bias: 0.8,
    render: (p) => (
      <polygon points={pts([p(19.4, 0.92, 1.6), p(26.6, 0.92, 1.6), p(26.6, 0.92, 5.6), p(19.4, 0.92, 5.6)])} fill="#485a70" className="hs-tv" />
    ),
  },
  box([21.5, 6.4, 24.5, 8.1], 0, 1.6, "#ce8261"),
  box([19, 10.2, 26.5, 12.8], 0, 2.6, "#eb8c6f"),
  box([19, 12.6, 26.5, 13.5], 0, 4.6, "#dd7a5f", { noShadow: true }),
  box([28, 1.6, 29.2, 2.8], 0, 2.6, "#ab6343"),
  { t: "blob", u: 28.6, v: 2.2, h: 4.6, rx: 7, ry: 8.5, c: "#6c945a" },

  // library
  box([31.6, 0.6, 39.4, 1.8], 0, 9, "#8c6036"),
  {
    t: "cust", u: 39.4, v: 1.8, bias: 1.2,
    render: (p) => {
      const colors = ["#c95f4f", "#7fa9a3", "#5f8f7a", "#b56a9f", "#e7c14e", "#cf7f4f", "#5b7fb5"];
      const out: React.ReactNode[] = [];
      for (let row = 0; row < 2; row++) {
        const h0 = 2.2 + row * 2.7;
        for (let i = 0; i < 8; i++) {
          const u1 = 32 + i * 0.85;
          out.push(
            <polygon
              key={`${row}-${i}`}
              points={pts([p(u1, 1.82, h0), p(u1 + 0.62, 1.82, h0), p(u1 + 0.62, 1.82, h0 + 1.9), p(u1, 1.82, h0 + 1.9)])}
              fill={colors[(i + row * 3) % colors.length]}
            />,
          );
        }
      }
      return <g>{out}</g>;
    },
  },
  box([35, 6, 37.6, 8.4], 0, 2.8, "#6f9a87"),
  box([37.9, 6.6, 38.3, 7], 0, 5, "#483d31", { noShadow: true }),
  box([37.5, 6.2, 38.7, 7.4], 5, 6.4, "#f3c760", { noShadow: true }),

  // garage / workshop
  box([0.8, 15, 3, 25], 0, 4, "#967a58"),
  box([9.5, 22.5, 12.2, 25.2], 0, 2.4, "#c4a442"),
  box([10, 20.4, 12, 22.2], 0, 1.8, "#e9c760"),
  box([9.8, 23, 11.4, 24.4], 2.4, 4.2, "#ddb54e", { noShadow: true }),

  // balcony / garden deck
  box([33.5, 19.5, 36.5, 21.8], 0, 1.8, "#ceaa79"),
  box([31, 24.5, 33, 26.5], 0, 2.2, "#755b3b"),
  { t: "blob", u: 32, v: 25.5, h: 3.6, rx: 8, ry: 9, c: "#6c945a" },
  box([37.5, 24.5, 39.5, 26.5], 0, 2.2, "#755b3b"),
  { t: "blob", u: 38.5, v: 25.5, h: 3.6, rx: 8, ry: 9, c: "#8cb679" },
  box([31.2, 26.6, 31.7, 27.1], 0, 4.5, "#5e492f", { noShadow: true }),
  {
    t: "cust", u: 36, v: 21, bias: 6,
    render: (p) => {
      const a = p(31.4, 26.8, 4.5);
      const c = p(36, 20, 6);
      const b = p(40, 14.6, H);
      const bulbs = [0.15, 0.35, 0.55, 0.75, 0.92].map((t) => {
        const x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0];
        const y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1] + 2;
        return <circle key={t} cx={x} cy={y} r="1.8" fill="#f2c14e" className="hs-bulb" />;
      });
      return (
        <g>
          <path d={`M${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0]},${b[1]}`} fill="none" stroke="#4a4536" strokeWidth="1" opacity="0.6" />
          {bulbs}
        </g>
      );
    },
  },

  // interior dividers (low, E46) with door gaps
  { t: "panel", a: { u: 14.5, v: 0 }, b: { u: 14.5, v: 5.8 }, h0: 0, h1: 2.8, c: "#a39476", top: "#f1ddb5" },
  { t: "panel", a: { u: 14.5, v: 8.5 }, b: { u: 14.5, v: 14 }, h0: 0, h1: 2.8, c: "#a39476", top: "#f1ddb5" },
  { t: "panel", a: { u: 30.5, v: 0 }, b: { u: 30.5, v: 3.8 }, h0: 0, h1: 2.8, c: "#a39476", top: "#f1ddb5" },
  { t: "panel", a: { u: 30.5, v: 6.5 }, b: { u: 30.5, v: 10 }, h0: 0, h1: 2.8, c: "#a39476", top: "#f1ddb5" },
  { t: "panel", a: { u: 14.5, v: 14 }, b: { u: 14.5, v: 18.8 }, h0: 0, h1: 2.8, c: "#a39476", top: "#f1ddb5" },
  { t: "panel", a: { u: 14.5, v: 21.5 }, b: { u: 14.5, v: 28 }, h0: 0, h1: 2.8, c: "#a39476", top: "#f1ddb5" },
  { t: "panel", a: { u: 30, v: 14 }, b: { u: 30, v: 18.8 }, h0: 0, h1: 1.8, c: "#a39476", top: "#f1ddb5" },
  { t: "panel", a: { u: 30, v: 21.5 }, b: { u: 30, v: 28 }, h0: 0, h1: 1.8, c: "#a39476", top: "#f1ddb5" },

  // the staircase: two profile stringers + riser/tread steps between them
  ...stairPrims(),
];

const UPPER_RUGS: { r: [number, number, number, number]; c: string }[] = [
  { r: [9, 6.5, 13.5, 9.5], c: "#a8d4de" },
  { r: [20.5, 6.5, 22.8, 8.2], c: "#e97f5f" },
];

const UPPER: Prim[] = [
  // bedroom
  box([1, 4, 7.5, 9.6], H, H + 2, "#ae7f52"),
  box([1.3, 4.3, 7.2, 9.3], H + 2, H + 2.6, "#f0f4f6", { noShadow: true }),
  box([1.5, 4.6, 2.9, 6.4], H + 2.6, H + 3.1, "#f8f2e5", { noShadow: true }),
  box([3.4, 4.3, 7.2, 9.3], H + 2.6, H + 3, "#6a9ac8", { noShadow: true }),
  box([12.5, 0.6, 15.5, 2.6], H, H + 7, "#8c6036"),
  box([8.2, 4, 9.8, 5.4], H, H + 2, "#ae7f52"),
  box([8.5, 4.3, 9.5, 5.1], H + 2, H + 3.1, "#f3c760", { noShadow: true }),

  // bath
  box([17.6, 0.8, 19.9, 5.8], H, H + 2, "#f0f4f6"),
  {
    t: "cust", u: 19.9, v: 5.8, bias: 0.5,
    render: (p) => (
      <polygon points={pts([p(17.9, 1.1, H + 2.02), p(19.6, 1.1, H + 2.02), p(19.6, 5.5, H + 2.02), p(17.9, 5.5, H + 2.02)])} fill="#a8d4de" />
    ),
  },
  box([22, 0.8, 23.4, 2.2], H, H + 2.8, "#dde0e5"),

  // office (t6): desk, three monitors facing the chair, keyboard, chair
  box([25.6, 0.8, 33.6, 3.4], H, H + 2.8, "#c08e60"),
  box([26.1, 1.3, 28.3, 1.7], H + 3.1, H + 4.8, "#24262b", { noShadow: true }),
  box([28.8, 1.3, 31.4, 1.7], H + 3.1, H + 5.1, "#24262b", { noShadow: true }),
  box([31.9, 1.3, 33.2, 1.7], H + 3.1, H + 5.5, "#24262b", { noShadow: true }),
  // screens anchor to the DESK's far corner so they always paint after the
  // containment-lifted monitors (rot0 face-on; edge-on or hidden elsewhere)
  {
    t: "cust", u: 33.6, v: 3.4, bias: 1.0,
    render: (p) => (
      <polygon points={pts([p(26.3, 1.72, H + 3.3), p(28.1, 1.72, H + 3.3), p(28.1, 1.72, H + 4.6), p(26.3, 1.72, H + 4.6)])} fill="#5a86b8" className="hs-screen" />
    ),
  },
  {
    t: "cust", u: 33.6, v: 3.4, bias: 1.1,
    render: (p) => (
      <polygon points={pts([p(29, 1.72, H + 3.3), p(31.2, 1.72, H + 3.3), p(31.2, 1.72, H + 4.9), p(29, 1.72, H + 4.9)])} fill="#6a9ac8" className="hs-screen" />
    ),
  },
  {
    t: "cust", u: 33.6, v: 3.4, bias: 1.2,
    render: (p) => (
      <polygon points={pts([p(32.05, 1.72, H + 3.3), p(33.05, 1.72, H + 3.3), p(33.05, 1.72, H + 5.3), p(32.05, 1.72, H + 5.3)])} fill="#58d08a" className="hs-screen" />
    ),
  },
  box([28.7, 2.4, 30.7, 3], H + 2.82, H + 3, "#434750", { noShadow: true }),
  box([31.2, 2.5, 31.7, 2.95], H + 2.82, H + 3, "#5c6270", { noShadow: true }),
  box([26.8, 2.5, 27.3, 3], H + 2.82, H + 3.4, "#c95f4f", { noShadow: true }),
  // the chair: base disc, post, seat, backrest (E47)
  { t: "blob", u: 29.9, v: 5.65, h: H, rx: 5.2, ry: 2.6, c: "#23262b" },
  box([29.75, 5.5, 30.1, 5.85], H, H + 1.5, "#3a3d44", { noShadow: true }),
  box([28.9, 4.7, 30.9, 6.3], H + 1.5, H + 1.95, "#8b3631", { noShadow: true }),
  box([28.9, 6.2, 30.9, 6.6], H + 1.95, H + 4.7, "#ac534e", { noShadow: true }),

  // server nook
  { t: "panel", a: { u: 34.5, v: 4.2 }, b: { u: 34.5, v: 7 }, h0: H, h1: H + 2.6, c: "#a39476", top: "#f1ddb5" },
  {
    t: "cust", u: 34.5, v: 2.4, bias: 0.4,
    render: (p) => (
      <path
        d={`M${p(33.6, 2.4, H)[0]},${p(33.6, 2.4, H)[1]} L${p(35.4, 2.4, H)[0]},${p(35.4, 2.4, H)[1]}`}
        stroke="#1b2b22"
        strokeWidth="1.4"
        fill="none"
      />
    ),
  },
  box([35.4, 0.8, 38.6, 3.6], H, H + 6.8, "#2f3642", { cls: "hs-rack" }),
  {
    t: "cust", u: 38.6, v: 3.6, bias: 1.2,
    render: (p) => {
      const colors = ["#58d08a", "#f2c14e", "#25303f"];
      const cells: React.ReactNode[] = [];
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
          const u1 = 35.7 + col * 0.5;
          const h0 = H + 1 + row * 0.9;
          cells.push(
            <polygon
              key={`${row}-${col}`}
              points={pts([p(u1, 3.62, h0), p(u1 + 0.32, 3.62, h0), p(u1 + 0.32, 3.62, h0 + 0.28), p(u1, 3.62, h0 + 0.28)])}
              fill={colors[(row * 6 + col) % 3]}
              className={(row * 6 + col) % 3 !== 2 ? "hs-led" : undefined}
            />,
          );
        }
      }
      return <g>{cells}</g>;
    },
  },
  box([35.4, 6, 38.6, 8.6], H, H + 2.2, "#ae7f52"),
  box([35.8, 6.2, 38.4, 7.8], H + 2.2, H + 4.7, "#4b5360", { noShadow: true }),
  {
    t: "cust", u: 38.6, v: 8.6, bias: 1.5,
    render: (p) => (
      <polygon
        points={pts([p(36, 7.82, H + 2.45), p(38.2, 7.82, H + 2.45), p(38.2, 7.82, H + 4.45), p(36, 7.82, H + 4.45)])}
        fill="#0d2b1a"
        className="hs-crt"
      />
    ),
  },
];

function stairPrims(): Prim[] {
  const u1 = 15.8;
  const u2 = 19.2;
  const N = 8;
  const vB = 21.2;
  const vT = 13.6;
  const dh = H / N;
  const dv = (vB - vT) / N;
  const wood = "#c9a06a";
  const profile: [number, number][] = [[vB, 0]];
  for (let i = 0; i < N; i++) profile.push([vB - i * dv, i * dh], [vB - i * dv, (i + 1) * dh]);
  profile.push([vT, H], [vT, 0]);

  const stringer = (u: number): Prim => ({
    t: "cust", u, v: 17.4,
    render: (p) => <polygon points={pts(profile.map(([v, h]) => p(u, v, h)))} fill={shade(wood, 0.62)} />,
  });
  const steps: Prim[] = [];
  for (let i = 0; i < N; i++) {
    const vFront = vB - i * dv;
    const vBack = vFront - dv;
    steps.push({
      t: "cust", u: 17.5, v: vFront,
      render: (p) => (
        <g>
          <polygon
            points={pts([p(u1, vFront, i * dh), p(u2, vFront, i * dh), p(u2, vFront, (i + 1) * dh), p(u1, vFront, (i + 1) * dh)])}
            fill={shade(wood, 0.8)}
          />
          <polygon
            points={pts([p(u1, vBack, (i + 1) * dh), p(u2, vBack, (i + 1) * dh), p(u2, vFront, (i + 1) * dh), p(u1, vFront, (i + 1) * dh)])}
            fill={i % 2 ? wood : shade(wood, 1.06)}
          />
        </g>
      ),
    });
  }
  return [stringer(u1), ...steps, stringer(u2)];
}

/* ================= exterior walls (all four sides, per floor) ================= */

type Win = { t1: number; t2: number; h0: number; h1: number };
type Wall = {
  p1: P2; p2: P2;
  n: [number, number];
  h0: number; h1: number;
  windows?: Win[];
  decor?: (p: Proj) => React.ReactNode;
};

const pegboard = (p: Proj) => (
  <g>
    <polygon points={pts([p(0.04, 16, 5), p(0.04, 23, 5), p(0.04, 23, 9), p(0.04, 16, 9)])} fill="#c9a06a" />
    {[17, 18.6, 20.2, 21.8].map((v) => (
      <polygon key={v} points={pts([p(0.05, v, 5.8), p(0.05, v + 0.5, 5.8), p(0.05, v + 0.5, 7.8), p(0.05, v, 7.8)])} fill="#7a5c38" />
    ))}
  </g>
);

const GROUND_WALLS: Wall[] = [
  { p1: { u: 0, v: 0 }, p2: { u: 40, v: 0 }, n: [0, -1], h0: 0, h1: WALL_H, windows: [{ t1: 0.065, t2: 0.21, h0: 3.4, h1: 9.2 }, { t1: 0.5, t2: 0.65, h0: 3.4, h1: 9.2 }] },
  { p1: { u: 0, v: 0 }, p2: { u: 0, v: 28 }, n: [-1, 0], h0: 0, h1: WALL_H, windows: [{ t1: 0.64, t2: 0.857, h0: 3.4, h1: 8.4 }], decor: pegboard },
  { p1: { u: 0, v: 28 }, p2: { u: 40, v: 28 }, n: [0, 1], h0: 0, h1: WALL_H, windows: [{ t1: 0.125, t2: 0.275, h0: 3.4, h1: 8.4 }] },
  { p1: { u: 40, v: 0 }, p2: { u: 40, v: 28 }, n: [1, 0], h0: 0, h1: WALL_H, windows: [{ t1: 0.59, t2: 0.8, h0: 3.4, h1: 8.4 }] },
];

const UPPER_WALLS: Wall[] = [
  { p1: { u: 0, v: 0 }, p2: { u: 40, v: 0 }, n: [0, -1], h0: H, h1: H + 8.8, windows: [{ t1: 0.075, t2: 0.22, h0: H + 3, h1: H + 7.8 }, { t1: 0.65, t2: 0.785, h0: H + 3, h1: H + 7.8 }] },
  { p1: { u: 0, v: 0 }, p2: { u: 0, v: 14.6 }, n: [-1, 0], h0: H, h1: H + 8.8, windows: [{ t1: 0.24, t2: 0.58, h0: H + 3, h1: H + 7.8 }] },
  { p1: { u: 0, v: 14.6 }, p2: { u: 40, v: 14.6 }, n: [0, 1], h0: H, h1: H + 8.8, windows: [{ t1: 0.2, t2: 0.33, h0: H + 3, h1: H + 7.8 }, { t1: 0.52, t2: 0.65, h0: H + 3, h1: H + 7.8 }] },
  { p1: { u: 40, v: 0 }, p2: { u: 40, v: 14.6 }, n: [1, 0], h0: H, h1: H + 8.8, windows: [{ t1: 0.15, t2: 0.5, h0: H + 3, h1: H + 7.8 }] },
];

const SLAB_EDGES: Wall[] = [
  { p1: { u: 0, v: 0 }, p2: { u: 40, v: 0 }, n: [0, -1], h0: WALL_H, h1: H },
  { p1: { u: 0, v: 0 }, p2: { u: 0, v: 14.6 }, n: [-1, 0], h0: WALL_H, h1: H },
  { p1: { u: 0, v: 14.6 }, p2: { u: 40, v: 14.6 }, n: [0, 1], h0: WALL_H, h1: H },
  { p1: { u: 40, v: 0 }, p2: { u: 40, v: 14.6 }, n: [1, 0], h0: WALL_H, h1: H },
];

/* ================= rendering ================= */

const lerp = (a: P2, b: P2, t: number): P2 => ({ u: a.u + (b.u - a.u) * t, v: a.v + (b.v - a.v) * t });

function isFar(rot: Rot, n: [number, number]): boolean {
  const [mu, mv] = mapDir(rot, n[0], n[1]);
  return mu < 0 || mv < 0;
}

/** view-space plane orientation of a mapped segment: "u" (dark) or "v" (mid) */
function planeOf(rot: Rot, a: P2, b: P2): "u" | "v" {
  const [au] = mapUV(rot, a.u, a.v);
  const [bu] = mapUV(rot, b.u, b.v);
  return Math.abs(au - bu) < 0.01 ? "u" : "v";
}

function WallFace({ w, rot, p, face, edge }: { w: Wall; rot: Rot; p: Proj; face: [string, string]; edge: [string, string] }) {
  const pl = planeOf(rot, w.p1, w.p2);
  const fill = pl === "u" ? face[0] : face[1];
  const edgeFill = pl === "u" ? edge[0] : edge[1];
  const inw: [number, number] = [-w.n[0] * 0.7, -w.n[1] * 0.7];
  return (
    <g>
      <polygon points={pts([p(w.p1.u, w.p1.v, w.h0), p(w.p2.u, w.p2.v, w.h0), p(w.p2.u, w.p2.v, w.h1), p(w.p1.u, w.p1.v, w.h1)])} fill={fill} />
      <polygon
        points={pts([
          p(w.p1.u, w.p1.v, w.h1), p(w.p2.u, w.p2.v, w.h1),
          p(w.p2.u + inw[0], w.p2.v + inw[1], w.h1), p(w.p1.u + inw[0], w.p1.v + inw[1], w.h1),
        ])}
        fill={edgeFill}
      />
      {w.windows?.map((win, i) => {
        const a = lerp(w.p1, w.p2, win.t1);
        const b = lerp(w.p1, w.p2, win.t2);
        const ia = lerp(w.p1, w.p2, win.t1 + 0.012);
        const ib = lerp(w.p1, w.p2, win.t2 - 0.012);
        return (
          <g key={i}>
            <polygon points={pts([p(a.u, a.v, win.h0), p(b.u, b.v, win.h0), p(b.u, b.v, win.h1), p(a.u, a.v, win.h1)])} fill="#8a6b45" />
            <polygon
              points={pts([p(ia.u, ia.v, win.h0 + 0.6), p(ib.u, ib.v, win.h0 + 0.6), p(ib.u, ib.v, win.h1 - 0.6), p(ia.u, ia.v, win.h1 - 0.6)])}
              fill="#d3e8da"
              className="hs-glass"
            />
          </g>
        );
      })}
      {w.decor?.(p)}
    </g>
  );
}

function renderPrim(prim: Prim, rot: Rot, p: Proj, key: number): React.ReactNode {
  if (prim.t === "box") {
    const [a1, b1] = mapUV(rot, prim.r[0], prim.r[1]);
    const [a2, b2] = mapUV(rot, prim.r[2], prim.r[3]);
    const u1 = Math.min(a1, a2);
    const u2 = Math.max(a1, a2);
    const v1 = Math.min(b1, b2);
    const v2 = Math.max(b1, b2);
    return (
      <g key={key} className={prim.cls}>
        <polygon points={pts([iso(u2, v1, prim.h0), iso(u2, v2, prim.h0), iso(u2, v2, prim.h1), iso(u2, v1, prim.h1)])} fill={shade(prim.c, 0.68)} />
        <polygon points={pts([iso(u1, v2, prim.h0), iso(u2, v2, prim.h0), iso(u2, v2, prim.h1), iso(u1, v2, prim.h1)])} fill={shade(prim.c, 0.84)} />
        <polygon points={pts([iso(u1, v1, prim.h1), iso(u2, v1, prim.h1), iso(u2, v2, prim.h1), iso(u1, v2, prim.h1)])} fill={prim.c} />
      </g>
    );
  }
  if (prim.t === "blob") {
    const [x, y] = p(prim.u, prim.v, prim.h);
    return <ellipse key={key} cx={x} cy={y} rx={prim.rx} ry={prim.ry} fill={prim.c} />;
  }
  if (prim.t === "panel") {
    const pl = planeOf(rot, prim.a, prim.b);
    const off: [number, number] = pl === "u" ? [-0.6, 0] : [0, -0.6];
    const fill = pl === "u" ? shade(prim.c, 0.92) : prim.c;
    const [oa, ob] = [prim.a, prim.b].map((q) => {
      const [mu, mv] = mapUV(rot, q.u, q.v);
      return { mu, mv };
    });
    return (
      <g key={key}>
        <polygon
          points={pts([
            iso(oa.mu, oa.mv, prim.h0), iso(ob.mu, ob.mv, prim.h0),
            iso(ob.mu, ob.mv, prim.h1), iso(oa.mu, oa.mv, prim.h1),
          ])}
          fill={fill}
        />
        {prim.top && (
          <polygon
            points={pts([
              iso(oa.mu, oa.mv, prim.h1), iso(ob.mu, ob.mv, prim.h1),
              iso(ob.mu + off[0], ob.mv + off[1], prim.h1), iso(oa.mu + off[0], oa.mv + off[1], prim.h1),
            ])}
            fill={prim.top}
          />
        )}
      </g>
    );
  }
  return <g key={key}>{prim.render(p)}</g>;
}

function depthKey(prim: Prim, rot: Rot): number {
  if (prim.t === "box") {
    const [a1, b1] = mapUV(rot, prim.r[0], prim.r[1]);
    const [a2, b2] = mapUV(rot, prim.r[2], prim.r[3]);
    return Math.max(a1, a2) + Math.max(b1, b2);
  }
  if (prim.t === "panel") {
    const [a1, b1] = mapUV(rot, prim.a.u, prim.a.v);
    const [a2, b2] = mapUV(rot, prim.b.u, prim.b.v);
    return Math.max(a1 + b1, a2 + b2) + 0.2;
  }
  const [mu, mv] = mapUV(rot, prim.u, prim.v);
  return mu + mv + (prim.t === "cust" ? (prim.bias ?? 0) : 0);
}

function flatPts(p: Proj, r: [number, number, number, number], h: number): string {
  return pts([p(r[0], r[1], h), p(r[2], r[1], h), p(r[2], r[3], h), p(r[0], r[3], h)]);
}

/** Soft contact shadow under a floor-standing box. */
function shadowFor(prim: Prim, p: Proj, floorH: number, key: number): React.ReactNode {
  if (prim.t !== "box" || prim.noShadow || prim.h0 > floorH + 0.1) return null;
  const cu = (prim.r[0] + prim.r[2]) / 2;
  const cv = (prim.r[1] + prim.r[3]) / 2;
  const [x, y] = p(cu, cv, floorH);
  const rx = ((prim.r[2] - prim.r[0]) + (prim.r[3] - prim.r[1])) * 0.5 * S * 0.72;
  return <ellipse key={key} cx={x} cy={y + 1.5} rx={rx} ry={rx * 0.42} fill="rgba(58,46,26,0.15)" />;
}

/* ================= the scene, assembled per angle ================= */

/**
 * Depth keys with containment lifting: a box resting ON another box (its
 * footprint contained, its base at the other's top) must paint after it at
 * EVERY angle — a mattress never hides inside its bed frame. Two passes so
 * stacks of three (pillow on mattress on frame) resolve.
 */
function sortedWithLift(prims: Prim[], rot: Rot): Prim[] {
  const keys = prims.map((pr) => depthKey(pr, rot));
  const contains = (b: Extract<Prim, { t: "box" }>, a: Extract<Prim, { t: "box" }>) =>
    a.r[0] >= b.r[0] - 0.05 && a.r[1] >= b.r[1] - 0.05 && a.r[2] <= b.r[2] + 0.05 && a.r[3] <= b.r[3] + 0.05;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < prims.length; i++) {
      const a = prims[i];
      if (a.t !== "box") continue;
      for (let j = 0; j < prims.length; j++) {
        if (i === j) continue;
        const b = prims[j];
        if (b.t !== "box" || a === b) continue;
        if (contains(b, a) && a.h0 >= b.h1 - 0.35 && a.h0 < b.h1 + 1) {
          keys[i] = Math.max(keys[i], keys[j] + 0.5);
        }
      }
    }
  }
  return prims
    .map((pr, i) => ({ pr, k: keys[i] }))
    .sort((x, y) => x.k - y.k)
    .map((x) => x.pr);
}

export function SceneView({ rot }: { rot: Rot }) {
  const p = makeProj(rot);
  const groundSorted = sortedWithLift(GROUND, rot);
  const upperSorted = sortedWithLift(UPPER, rot);
  const groundFloors = ROOMS.filter((r) => r.h === 0);
  const upperFloors = ROOMS.filter((r) => r.h === H);

  // plinth: near edges of the plot slab
  const plotEdges: Wall[] = [
    { p1: { u: 0, v: 0 }, p2: { u: 40, v: 0 }, n: [0, -1], h0: -1.4, h1: 0 },
    { p1: { u: 0, v: 0 }, p2: { u: 0, v: 28 }, n: [-1, 0], h0: -1.4, h1: 0 },
    { p1: { u: 0, v: 28 }, p2: { u: 40, v: 28 }, n: [0, 1], h0: -1.4, h1: 0 },
    { p1: { u: 40, v: 0 }, p2: { u: 40, v: 28 }, n: [1, 0], h0: -1.4, h1: 0 },
  ];

  return (
    <g>
      {plotEdges.filter((e) => !isFar(rot, e.n)).map((e, i) => (
        <polygon
          key={`pl-${i}`}
          points={pts([p(e.p1.u, e.p1.v, e.h0), p(e.p2.u, e.p2.v, e.h0), p(e.p2.u, e.p2.v, e.h1), p(e.p1.u, e.p1.v, e.h1)])}
          fill={planeOf(rot, e.p1, e.p2) === "u" ? "#897a61" : "#ab9979"}
        />
      ))}
      <polygon points={flatPts(p, [0, 0, 40, 28], 0)} fill="#cebc99" />

      {/* ground: far walls → floors → rugs → shadows → sorted solids */}
      <g className="i-shell">
        {GROUND_WALLS.filter((w) => isFar(rot, w.n)).map((w, i) => (
          <WallFace key={i} w={w} rot={rot} p={p} face={["#a3967a", "#cfc1a1"]} edge={["#f1e0bc", "#f5e6c4"]} />
        ))}
      </g>
      {groundFloors.map((r) => (
        <polygon key={r.key} points={flatPts(p, [r.u1, r.v1, r.u2, r.v2], 0.02)} fill={r.floor} className={`hs-floor hs-floor-${r.key}`} />
      ))}
      {GROUND_RUGS.map((r, i) => (
        <polygon key={i} points={flatPts(p, r.r, 0.03)} fill={r.c} />
      ))}
      <g className="i-furn">
        {GROUND.map((prim, i) => shadowFor(prim, p, 0, i))}
        {groundSorted.map((prim, i) => renderPrim(prim, rot, p, i))}
      </g>

      {/* the upper slab with its fascia edges */}
      <g className="i-shell">
        {SLAB_EDGES.map((e, i) => (
          <polygon
            key={i}
            points={pts([p(e.p1.u, e.p1.v, e.h0), p(e.p2.u, e.p2.v, e.h0), p(e.p2.u, e.p2.v, e.h1), p(e.p1.u, e.p1.v, e.h1)])}
            fill={planeOf(rot, e.p1, e.p2) === "u" ? "#9e9076" : "#c5b494"}
          />
        ))}
        <polygon points={flatPts(p, [0, 0, 40, 14.6], H)} fill="#ead8b6" />
      </g>

      {/* upper: floors → rugs → far walls → shadows → sorted solids */}
      {upperFloors.map((r) => (
        <polygon key={r.key} points={flatPts(p, [r.u1, r.v1, r.u2, r.v2], H + 0.02)} fill={r.floor} className={`hs-floor hs-floor-${r.key}`} />
      ))}
      {UPPER_RUGS.map((r, i) => (
        <polygon key={i} points={flatPts(p, r.r, H + 0.03)} fill={r.c} />
      ))}
      <g className="i-shell">
        {UPPER_WALLS.filter((w) => isFar(rot, w.n)).map((w, i) => (
          <WallFace key={i} w={w} rot={rot} p={p} face={["#a3967a", "#cfc1a1"]} edge={["#f1e0bc", "#f5e6c4"]} />
        ))}
      </g>
      <g className="i-furn">
        {UPPER.map((prim, i) => shadowFor(prim, p, H, i))}
        {upperSorted.map((prim, i) => renderPrim(prim, rot, p, i))}
      </g>
    </g>
  );
}

/* ---------------- garden (static — the world doesn't spin, the camera does) ---------------- */

function Tree({ cx, cy, s, c1, c2 }: { cx: number; cy: number; s: number; c1: string; c2: string }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={30 * s} ry={38 * s} fill={c1} />
      <ellipse cx={cx - 22 * s} cy={cy + 16 * s} rx={22 * s} ry={26 * s} fill={c2} />
      <ellipse cx={cx + 20 * s} cy={cy + 20 * s} rx={18 * s} ry={22 * s} fill={c2} />
    </g>
  );
}

export function Garden() {
  return (
    <g>
      <ellipse cx="54" cy="165" rx="480" ry="178" fill="#cec79f" opacity="0.9" />
      <ellipse cx="54" cy="160" rx="335" ry="100" fill="rgba(60,80,40,.3)" />
      <Tree cx={-330} cy={20} s={1.2} c1="#87a06b" c2="#7a9460" />
      <Tree cx={-255} cy={-60} s={0.9} c1="#8fa774" c2="#7a9460" />
      <Tree cx={470} cy={-15} s={1.1} c1="#87a06b" c2="#6f8a58" />
      <Tree cx={535} cy={120} s={1.3} c1="#8fa774" c2="#7a9460" />
      <Tree cx={425} cy={-95} s={0.8} c1="#87a06b" c2="#7a9460" />
      {/* stepping-stone path + a few flowers so the lawn isn't bare */}
      <path d="M228.6,126.9 Q145,306 111.6,266.4" fill="none" stroke="#8a8264" strokeWidth="1.2" />
      {[[204.7, 175.8], [180.3, 219.3], [157.6, 251.5], [138.2, 269.5], [122.8, 273.5]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="2.2" fill="#fff" opacity="0.85" />
      ))}
      {[[-180, 150, "#c95f4f"], [-150, 175, "#e7c14e"], [-200, 190, "#b56a9f"], [250, 240, "#c95f4f"], [285, 225, "#e7c14e"], [318, 258, "#b56a9f"]].map(([x, y, c]) => (
        <g key={`${x}${y}`}>
          <circle cx={x as number} cy={y as number} r="2.4" fill={c as string} />
          <circle cx={(x as number) + 7} cy={(y as number) + 5} r="1.8" fill={c as string} opacity="0.7" />
        </g>
      ))}
    </g>
  );
}

/* ---------------- leader-line labels (hover-revealed, angle-aware) ---------------- */

const LABEL_ANCHORS: { key: RoomKey; text: string; u: number; v: number; h: number }[] = [
  { key: "bedroom", text: "BEDROOM", u: 4, v: 8, h: H + 4 },
  { key: "kitchen", text: "KITCHEN", u: 4, v: 4, h: 6 },
  { key: "garage", text: "GARAGE / WORKSHOP", u: 4, v: 18, h: 4 },
  { key: "bath", text: "BATHROOM", u: 20.5, v: 3, h: H + 4 },
  { key: "office", text: "OFFICE", u: 29, v: 2, h: H + 5 },
  { key: "server", text: "SERVER", u: 37, v: 2, h: H + 5 },
  { key: "library", text: "LIBRARY", u: 36, v: 4, h: 6 },
  { key: "drawing", text: "DRAWING ROOM", u: 24, v: 11, h: 3 },
  { key: "balcony", text: "BALCONY / GARDEN", u: 35, v: 22, h: 2 },
];

export function Labels({ show, rot }: { show: RoomKey | null; rot: Rot }) {
  const p = makeProj(rot);
  return (
    <g className="hs-labels">
      {LABEL_ANCHORS.map((l) => {
        const [ax, ay] = p(l.u, l.v, l.h);
        const left = ax < 95;
        const tx = left ? -268 : 452;
        const lx = left ? -262 : 446;
        const ty = Math.max(-235, Math.min(315, ay));
        return (
          <g key={l.key} className={`hs-label${show === l.key ? " hs-label-on" : ""}`}>
            <line x1={ax} y1={ay} x2={lx} y2={ty + 3.5} stroke="currentColor" strokeWidth="1" opacity="0.45" />
            <circle cx={ax} cy={ay} r="2.6" fill="currentColor" />
            <text x={tx} y={ty} fontSize="10.5" letterSpacing="1.2" textAnchor={left ? "end" : "start"} fill="currentColor">
              {l.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}
