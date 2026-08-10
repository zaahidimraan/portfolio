/**
 * The house plan (E38/E40/E47): rooms, the walkability grid, A* pathfinding
 * and the daily schedule, compiled into a deterministic minute-by-minute
 * routine.
 *
 * E47: movement is collision-aware. Each floor is rasterised into a 0.5-unit
 * grid where walls AND furniture footprints (inflated by his body radius) are
 * blocked; routes come from A* over that grid, smoothed by line-of-sight so
 * they read as a person walking, not a robot on rails. Stations that sit ON
 * furniture (bed, sofa, desk chair) are reached via the nearest open cell
 * plus one deliberate final step.
 *
 * Everything here is pure data + pure functions so the routine can be
 * simulated offline (wall AND furniture sweeps) and resolved instantly for
 * the reduced-motion static scene.
 */

import { UPPER_H, type Proj } from "./iso";

export type RoomKey =
  | "kitchen" | "drawing" | "library" | "garage" | "hall" | "balcony"
  | "bedroom" | "bath" | "office" | "server";

export type Room = {
  key: RoomKey;
  label: string;
  u1: number; v1: number; u2: number; v2: number;
  h: number;
  floor: string;
};

/** Floor colours lifted from the art-direction SVG (house-day.svg). */
export const ROOMS: Room[] = [
  { key: "kitchen", label: "KITCHEN", u1: 0, v1: 0, u2: 14, v2: 14, h: 0, floor: "#e6bd85" },
  { key: "drawing", label: "DRAWING ROOM", u1: 15, v1: 0, u2: 30, v2: 14, h: 0, floor: "#e2b07e" },
  { key: "library", label: "LIBRARY", u1: 31, v1: 0, u2: 40, v2: 10, h: 0, floor: "#dcb887" },
  { key: "garage", label: "GARAGE / WORKSHOP", u1: 0, v1: 14, u2: 14, v2: 28, h: 0, floor: "#cfc5b4" },
  { key: "hall", label: "HALL", u1: 14, v1: 14, u2: 30, v2: 28, h: 0, floor: "#d9b988" },
  { key: "balcony", label: "BALCONY / GARDEN", u1: 30, v1: 14, u2: 40, v2: 28, h: 0, floor: "#d9c9a8" },
  { key: "bedroom", label: "BEDROOM", u1: 0, v1: 0, u2: 16, v2: 10, h: UPPER_H, floor: "#c9d3a8" },
  { key: "bath", label: "BATHROOM", u1: 17, v1: 0, u2: 24, v2: 10, h: UPPER_H, floor: "#bcd8de" },
  { key: "office", label: "OFFICE", u1: 25, v1: 0, u2: 34, v2: 10, h: UPPER_H, floor: "#f2c9a0" },
  { key: "server", label: "SERVER", u1: 35, v1: 0, u2: 39, v2: 10, h: UPPER_H, floor: "#8e97a8" },
];

export const ROOM_BY_KEY = Object.fromEntries(ROOMS.map((r) => [r.key, r])) as Record<RoomKey, Room>;

export type Pose = "idle" | "walk" | "sit" | "sleep" | "stir" | "squat" | "lean";

type Spot = { u: number; v: number; h: number; room: RoomKey; pose: Pose };

/**
 * Where he actually stands, sits or lies. Spots ON furniture (bed, sofa,
 * desk chair) are deliberately inside a footprint — the router walks to the
 * nearest open cell and takes one final step.
 */
export const NODES = {
  bed: { u: 6.2, v: 6.8, h: UPPER_H, room: "bedroom", pose: "sleep" },
  bathSpot: { u: 21, v: 4.5, h: UPPER_H, room: "bath", pose: "idle" },
  deskChair: { u: 29.8, v: 5.4, h: UPPER_H, room: "office", pose: "sit" },
  serverSpot: { u: 37, v: 4.8, h: UPPER_H, room: "server", pose: "squat" },
  sofa: { u: 22.5, v: 11.4, h: 0, room: "drawing", pose: "sit" },
  stove: { u: 6.5, v: 3.8, h: 0, room: "kitchen", pose: "stir" },
  shelf: { u: 35, v: 3.2, h: 0, room: "library", pose: "idle" },
  bench: { u: 5, v: 17.5, h: 0, room: "garage", pose: "squat" },
  lounger: { u: 33, v: 23, h: 0, room: "balcony", pose: "lean" },
} satisfies Record<string, Spot>;

export type NodeKey = keyof typeof NODES;

/* ---------------- the walkability grid (E47) ---------------- */

type Rect = [number, number, number, number]; // u1, v1, u2, v2

/** His body radius: obstacle rects inflate by this much. */
const RADIUS = 0.45;
const CELL = 0.5;

const STAIR_FOOT: Rect = [15.3, 13.4, 19.7, 21.4];
/** Pre-shrunk by RADIUS so grid inflation restores the true footprint — you
    can stand right at the stairwell's edge, which the stair nodes rely on. */
const STAIR_FOOT_SHRUNK: Rect = [
  STAIR_FOOT[0] + RADIUS, STAIR_FOOT[1] + RADIUS,
  STAIR_FOOT[2] - RADIUS, STAIR_FOOT[3] - RADIUS,
];

/** Walls with their door gaps, per floor. */
const WALLS_G: Rect[] = [
  [14.2, 0, 14.8, 5.8], [14.2, 8.5, 14.8, 14],       // kitchen | drawing
  [30.2, 0, 30.8, 3.8], [30.2, 6.5, 30.8, 10],       // drawing | library
  [14.2, 14, 14.8, 18.8], [14.2, 21.5, 14.8, 28],    // garage | hall
  [29.7, 14, 30.3, 18.8], [29.7, 21.5, 30.3, 28],    // hall | balcony rail
];
const WALLS_U: Rect[] = [
  [16.2, 0, 16.8, 10],                                // bedroom | bath
  [24.2, 0, 24.8, 10],                                // bath | office
  [34.2, 4.2, 34.8, 7],                               // office | server half wall
];

/** Furniture footprints he must walk around (matches scene.tsx geometry). */
const FURN_G: Rect[] = [
  [0.8, 0.6, 11, 2.8],      // kitchen counter
  [11.5, 0.6, 13.6, 2.8],   // fridge
  [4.6, 7.5, 11.6, 10.5],   // kitchen table + stools
  [18.5, 0.3, 27.5, 1.2],   // TV + media unit
  [21.5, 6.4, 24.5, 8.1],   // coffee table
  [19, 10.2, 26.5, 13.5],   // sofa
  [28, 1.6, 29.2, 2.8],     // plant
  [31.6, 0.6, 39.4, 1.8],   // bookshelf
  [35, 6, 38.7, 8.4],       // armchair + lamp
  [0.8, 15, 3, 25],         // workbench
  [9.5, 20.4, 12.2, 25.2],  // crates
  [33.5, 19.5, 36.5, 21.8], // lounger
  [31, 24.5, 33, 27.1],     // planter + light post
  [37.5, 24.5, 39.5, 26.5], // planter
];
const FURN_U: Rect[] = [
  [1, 4, 7.5, 9.6],         // bed
  [12.5, 0.6, 15.5, 2.6],   // wardrobe
  [8.2, 4, 9.8, 5.4],       // nightstand
  [17.6, 0.8, 19.9, 5.8],   // tub
  [22, 0.8, 23.4, 2.2],     // sink
  [25.6, 0.8, 33.6, 3.4],   // desk (the chair is his — not an obstacle)
  [35.4, 0.8, 38.6, 3.6],   // rack
  [35.4, 6, 38.6, 8.6],     // CRT desk
];

type Grid = {
  cols: number;
  rows: number;
  u0: number;
  v0: number;
  cells: Uint8Array; // 1 = walkable
};

function buildGrid(bounds: Rect, blocked: Rect[]): Grid {
  const [u0, v0, u1, v1] = bounds;
  const cols = Math.round((u1 - u0) / CELL);
  const rows = Math.round((v1 - v0) / CELL);
  const cells = new Uint8Array(cols * rows).fill(1);
  const inflated = blocked.map(
    ([a, b, c, d]): Rect => [a - RADIUS, b - RADIUS, c + RADIUS, d + RADIUS],
  );
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = u0 + (c + 0.5) * CELL;
      const v = v0 + (r + 0.5) * CELL;
      for (const [a, b, x, y] of inflated) {
        if (u >= a && u <= x && v >= b && v <= y) {
          cells[r * cols + c] = 0;
          break;
        }
      }
    }
  }
  return { cols, rows, u0, v0, cells };
}

// Keep him off the exact walls: the walkable bounds sit inside the shell.
// Ground: the u31–40 / v10–14 strip is outside every room, so block it too.
const GRID_G = buildGrid(
  [0.6, 0.6, 39.4, 27.4],
  [...WALLS_G, ...FURN_G, STAIR_FOOT_SHRUNK, [30.6, 9.6, 39.4, 14.4]],
);
// Upper: rooms plus the corridor; the stairwell is a hole in the floor.
const GRID_U = buildGrid([0.6, 0.6, 39.4, 14.2], [...WALLS_U, ...FURN_U, STAIR_FOOT_SHRUNK]);

function cellAt(g: Grid, u: number, v: number): number {
  const c = Math.floor((u - g.u0) / CELL);
  const r = Math.floor((v - g.v0) / CELL);
  if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) return -1;
  return r * g.cols + c;
}

function walkable(g: Grid, u: number, v: number): boolean {
  const i = cellAt(g, u, v);
  return i >= 0 && g.cells[i] === 1;
}

/** Straight segment stays on open cells (sampled every 0.2 units). */
function lineOfSight(g: Grid, a: P, b: P): boolean {
  const d = Math.hypot(b.u - a.u, b.v - a.v);
  const n = Math.max(2, Math.ceil(d / 0.2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (!walkable(g, a.u + (b.u - a.u) * t, a.v + (b.v - a.v) * t)) return false;
  }
  return true;
}

/** Nearest open cell centre to a point (ring search). */
function nearestOpen(g: Grid, u: number, v: number): P {
  if (walkable(g, u, v)) return { u, v };
  for (let ring = 1; ring < 16; ring++) {
    let best: P | null = null;
    let bestD = Infinity;
    for (let dr = -ring; dr <= ring; dr++) {
      for (let dc = -ring; dc <= ring; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== ring) continue;
        const cu = u + dc * CELL;
        const cv = v + dr * CELL;
        if (!walkable(g, cu, cv)) continue;
        const d = Math.hypot(cu - u, cv - v);
        if (d < bestD) {
          bestD = d;
          best = { u: cu, v: cv };
        }
      }
    }
    if (best) return best;
  }
  return { u, v };
}

/** A* over the grid, 8-connected, octile heuristic; then LOS-smoothed. */
function aStar(g: Grid, from: P, to: P): P[] {
  const start = cellAt(g, from.u, from.v);
  const goal = cellAt(g, to.u, to.v);
  if (start < 0 || goal < 0) return [from, to];
  const n = g.cols * g.rows;
  const gScore = new Float64Array(n).fill(Infinity);
  const fScore = new Float64Array(n).fill(Infinity);
  const came = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const cu = (i: number) => i % g.cols;
  const cv = (i: number) => Math.floor(i / g.cols);
  const heur = (i: number) => {
    const dx = Math.abs(cu(i) - cu(goal));
    const dy = Math.abs(cv(i) - cv(goal));
    return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
  };
  gScore[start] = 0;
  fScore[start] = heur(start);
  const open = new Set<number>([start]);
  while (open.size) {
    let cur = -1;
    for (const i of open) if (cur < 0 || fScore[i] < fScore[cur]) cur = i;
    if (cur === goal) break;
    open.delete(cur);
    closed[cur] = 1;
    const c = cu(cur);
    const r = cv(cur);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nc = c + dc;
        const nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= g.cols || nr >= g.rows) continue;
        const ni = nr * g.cols + nc;
        if (!g.cells[ni] || closed[ni]) continue;
        // no diagonal squeezing between two blocked cells
        if (dr && dc && (!g.cells[r * g.cols + nc] || !g.cells[nr * g.cols + c])) continue;
        const step = dr && dc ? 1.414 : 1;
        const cand = gScore[cur] + step;
        if (cand < gScore[ni]) {
          gScore[ni] = cand;
          fScore[ni] = cand + heur(ni);
          came[ni] = cur;
          open.add(ni);
        }
      }
    }
  }
  if (came[goal] < 0 && goal !== start) return [from, to];
  const cellPts: P[] = [];
  for (let i = goal; i >= 0; i = came[i]) {
    cellPts.unshift({ u: g.u0 + (cu(i) + 0.5) * CELL, v: g.v0 + (cv(i) + 0.5) * CELL });
    if (i === start) break;
  }
  // greedy line-of-sight smoothing
  const smooth: P[] = [from];
  let i = 0;
  while (i < cellPts.length - 1) {
    let j = cellPts.length - 1;
    while (j > i + 1 && !lineOfSight(g, smooth[smooth.length - 1], cellPts[j])) j--;
    smooth.push(cellPts[j]);
    i = j;
  }
  return smooth;
}

/* ---------------- routing across floors ---------------- */

type P = { u: number; v: number };
export type WayPt = { u: number; v: number; h: number };

const STAIR_BOTTOM: P = { u: 17.5, v: 21.9 };
const STAIR_TOP: P = { u: 17.5, v: 13.1 };

/** Full route between two spots, with the deliberate on/off-furniture steps. */
export function findRoute(from: Spot, to: Spot): WayPt[] {
  const floorOf = (s: { h: number }) => (s.h > 6 ? "u" : "g");
  const gridOf = (f: string) => (f === "u" ? GRID_U : GRID_G);
  const hOf = (f: string) => (f === "u" ? UPPER_H : 0);

  const legs: WayPt[] = [];
  const push = (pts: P[], h: number) => {
    for (const p of pts) {
      const last = legs[legs.length - 1];
      if (last && Math.abs(last.u - p.u) < 0.05 && Math.abs(last.v - p.v) < 0.05 && last.h === h) continue;
      legs.push({ u: p.u, v: p.v, h });
    }
  };

  const fa = floorOf(from);
  const fb = floorOf(to);
  const exitA = nearestOpen(gridOf(fa), from.u, from.v);
  const enterB = nearestOpen(gridOf(fb), to.u, to.v);
  const stairTop = nearestOpen(GRID_U, STAIR_TOP.u, STAIR_TOP.v);
  const stairBottom = nearestOpen(GRID_G, STAIR_BOTTOM.u, STAIR_BOTTOM.v);

  push([{ u: from.u, v: from.v }], hOf(fa));
  if (fa === fb) {
    push(aStar(gridOf(fa), exitA, enterB), hOf(fa));
  } else if (fa === "u") {
    push(aStar(GRID_U, exitA, stairTop), UPPER_H);
    legs.push({ ...stairBottom, h: 0 }); // h interpolates down the run
    push(aStar(GRID_G, stairBottom, enterB), 0);
  } else {
    push(aStar(GRID_G, exitA, stairBottom), 0);
    legs.push({ ...stairTop, h: UPPER_H }); // h interpolates up the run
    push(aStar(GRID_U, stairTop, enterB), UPPER_H);
  }
  push([{ u: to.u, v: to.v }], hOf(fb));
  return legs;
}

/* ---------------- the daily schedule (BUILD-SPEC §6) ---------------- */

export const SCHEDULE: { min: number; spot: NodeKey; doing: string }[] = [
  { min: 0, spot: "bed", doing: "asleep" },
  { min: 7.5 * 60, spot: "bathSpot", doing: "getting ready" },
  { min: 8 * 60 + 10, spot: "stove", doing: "breakfast" },
  { min: 9 * 60, spot: "deskChair", doing: "deep work" },
  { min: 13 * 60, spot: "stove", doing: "lunch" },
  { min: 14 * 60, spot: "deskChair", doing: "building" },
  { min: 18 * 60 + 30, spot: "bench", doing: "tinkering" },
  { min: 21 * 60, spot: "sofa", doing: "winding down" },
  { min: 23 * 60, spot: "bed", doing: "asleep" },
];

export const SUNRISE_MIN = 7 * 60;
export const SUNSET_MIN = 19 * 60;
/** The whole 24 h in six real minutes (spec §4). */
export const DAY_REAL_MS = 6 * 60 * 1000;
const SCENE_MIN_PER_REAL_S = 1440 / (DAY_REAL_MS / 1000);
/** Walk speed ≈ 1.4 s per room-length (~14 units) → 10 units per real second. */
const UNITS_PER_REAL_S = 10;

type Station = { kind: "station"; from: number; until: number; node: NodeKey };
type Walk = {
  kind: "walk";
  from: number;
  until: number;
  pts: WayPt[];
  /** Cumulative distance at each point, so position resolves by arc length. */
  cum: number[];
  total: number;
};
type Segment = Station | Walk;

function ptDist(a: WayPt, b: WayPt): number {
  return Math.hypot(a.u - b.u, a.v - b.v) + Math.abs(a.h - b.h) * 0.8;
}

/** The day compiled into stations and walks over 1440 scene minutes. */
function compileDay(): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i < SCHEDULE.length; i++) {
    const cur = SCHEDULE[i];
    if (i + 1 >= SCHEDULE.length) {
      segs.push({ kind: "station", from: cur.min, until: 1440, node: cur.spot });
      break;
    }
    const next = SCHEDULE[i + 1];
    const pts = findRoute(NODES[cur.spot], NODES[next.spot]);
    const cum: number[] = [0];
    for (let j = 1; j < pts.length; j++) cum.push(cum[j - 1] + ptDist(pts[j - 1], pts[j]));
    const total = cum[cum.length - 1];
    const walkSceneMin = (total / UNITS_PER_REAL_S) * SCENE_MIN_PER_REAL_S;
    const stationEnd = Math.max(cur.min, next.min - walkSceneMin);
    segs.push({ kind: "station", from: cur.min, until: stationEnd, node: cur.spot });
    segs.push({ kind: "walk", from: stationEnd, until: next.min, pts, cum, total });
  }
  return segs;
}

const DAY_SEGMENTS = compileDay();

export type AvatarState = {
  u: number; v: number; h: number;
  pose: Pose;
  facing: 1 | -1;
  room: RoomKey;
  doing: string;
};

function roomAt(u: number, v: number, h: number): RoomKey {
  for (const r of ROOMS) {
    if (Math.abs(r.h - (h > 6 ? UPPER_H : 0)) > 1) continue;
    if (u >= r.u1 && u <= r.u2 && v >= r.v1 && v <= r.v2) return r.key;
  }
  return h > 6 ? "bedroom" : "hall";
}

export function stateAt(minute: number): AvatarState {
  const m = ((minute % 1440) + 1440) % 1440;
  const doing = [...SCHEDULE].reverse().find((s) => s.min <= m)?.doing ?? "asleep";
  for (const seg of DAY_SEGMENTS) {
    if (m < seg.from || m >= seg.until) continue;
    if (seg.kind === "station") {
      const n = NODES[seg.node];
      return { u: n.u, v: n.v, h: n.h, pose: n.pose, facing: 1, room: n.room, doing };
    }
    const t = (m - seg.from) / (seg.until - seg.from);
    const d = t * seg.total;
    let j = 1;
    while (j < seg.cum.length - 1 && seg.cum[j] < d) j++;
    const a = seg.pts[j - 1];
    const b = seg.pts[j];
    const lt = (d - seg.cum[j - 1]) / Math.max(seg.cum[j] - seg.cum[j - 1], 1e-6);
    const u = a.u + (b.u - a.u) * lt;
    const v = a.v + (b.v - a.v) * lt;
    const h = a.h + (b.h - a.h) * lt;
    const dx = (b.u - a.u) - (b.v - a.v);
    return {
      u, v, h,
      pose: "walk",
      facing: dx >= 0 ? 1 : -1,
      room: roomAt(u, v, h),
      doing: "walking",
    };
  }
  const n = NODES.bed;
  return { u: n.u, v: n.v, h: n.h, pose: "sleep", facing: 1, room: "bedroom", doing };
}

/* ---------------- camera framing ---------------- */

/** Projected bounding box of a room at the current camera angle (zoom). */
export function roomBBox(room: Room, p: Proj): { x: number; y: number; w: number; h: number } {
  const corners: [number, number][] = [];
  for (const h of [room.h, room.h + 9]) {
    corners.push(p(room.u1, room.v1, h), p(room.u2, room.v1, h), p(room.u2, room.v2, h), p(room.u1, room.v2, h));
  }
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
