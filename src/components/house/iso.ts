/**
 * Isometric projection helpers (E38, BUILD-SPEC §3).
 *
 * Scene units → px: x = (u − v)·S, y = ((u + v)/2 − h)·S with S = 9.
 * The plot is 40×28 units, wall height 12 per storey, upper floor at h 13.2.
 * Every solid in the scene is an axis-aligned box drawn as three faces —
 * light top, mid left (v-facing) and dark right (u-facing) — which is exactly
 * how the art-direction SVG shades its furniture.
 */

export const S = 9;
export const WALL_H = 12;
export const UPPER_H = 13.2;

export function iso(u: number, v: number, h = 0): [number, number] {
  return [(u - v) * S, ((u + v) / 2 - h) * S];
}

/* ---------------- the orbit (E48) ---------------- */

/** Quarter-turn camera angles, clockwise. */
export type Rot = 0 | 1 | 2 | 3;

const CU = 20;
const CV = 14;

/** Rotate a plot point around the plot centre into view space. */
export function mapUV(rot: Rot, u: number, v: number): [number, number] {
  switch (rot) {
    case 0: return [u, v];
    case 1: return [CU + (v - CV), CV - (u - CU)];
    case 2: return [2 * CU - u, 2 * CV - v];
    default: return [CU - (v - CV), CV + (u - CU)];
  }
}

/** Rotate a direction (e.g. a wall's outward normal) into view space. */
export function mapDir(rot: Rot, du: number, dv: number): [number, number] {
  switch (rot) {
    case 0: return [du, dv];
    case 1: return [dv, -du];
    case 2: return [-du, -dv];
    default: return [-dv, du];
  }
}

/** Projection for a given camera angle: plot coords → screen px. */
export function makeProj(rot: Rot) {
  return (u: number, v: number, h = 0): [number, number] => {
    const [mu, mv] = mapUV(rot, u, v);
    return iso(mu, mv, h);
  };
}

export type Proj = ReturnType<typeof makeProj>;

const r1 = (n: number) => Math.round(n * 10) / 10;

export function pts(list: [number, number][]): string {
  return list.map(([x, y]) => `${r1(x)},${r1(y)}`).join(" ");
}

/** Darken/lighten a hex colour by a factor (0..1 darkens, >1 lightens). */
export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x * f)));
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return `#${((c(r) << 16) | (c(g) << 8) | c(b)).toString(16).padStart(6, "0")}`;
}

/** A flat quad on the ground plane (floors, rugs, decks). */
export function floorPts(u1: number, v1: number, u2: number, v2: number, h = 0): string {
  return pts([iso(u1, v1, h), iso(u2, v1, h), iso(u2, v2, h), iso(u1, v2, h)]);
}

export type Face = { d: string; fill: string };

/**
 * The three visible faces of a box from (u1,v1,h0) to (u2,v2,h1).
 * Base colour paints the top; the v2 face is mid; the u2 face is dark.
 */
export function box(
  u1: number, v1: number, u2: number, v2: number,
  h0: number, h1: number, c: string,
): Face[] {
  return [
    { d: pts([iso(u2, v1, h0), iso(u2, v2, h0), iso(u2, v2, h1), iso(u2, v1, h1)]), fill: shade(c, 0.68) },
    { d: pts([iso(u1, v2, h0), iso(u2, v2, h0), iso(u2, v2, h1), iso(u1, v2, h1)]), fill: shade(c, 0.84) },
    { d: pts([iso(u1, v1, h1), iso(u2, v1, h1), iso(u2, v2, h1), iso(u1, v2, h1)]), fill: c },
  ];
}

/**
 * A wall slab standing on the v = const line (the "back-right" walls of the
 * cutaway) — one visible inner face plus a lit top edge.
 */
export function wallV(u1: number, u2: number, v: number, h0: number, h1: number, c: string, edge: string): Face[] {
  return [
    { d: pts([iso(u1, v, h0), iso(u2, v, h0), iso(u2, v, h1), iso(u1, v, h1)]), fill: c },
    { d: pts([iso(u1, v, h1), iso(u2, v, h1), iso(u2, v - 0.7, h1), iso(u1, v - 0.7, h1)]), fill: edge },
  ];
}

/** A wall slab on the u = const line (the "back-left" walls). */
export function wallU(v1: number, v2: number, u: number, h0: number, h1: number, c: string, edge: string): Face[] {
  return [
    { d: pts([iso(u, v1, h0), iso(u, v2, h0), iso(u, v2, h1), iso(u, v1, h1)]), fill: c },
    { d: pts([iso(u, v1, h1), iso(u, v2, h1), iso(u - 0.7, v2, h1), iso(u - 0.7, v1, h1)]), fill: edge },
  ];
}
