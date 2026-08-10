/**
 * The house plan (E38/E40): rooms, standing spots, the waypoint graph and the
 * daily schedule, compiled into a deterministic minute-by-minute routine.
 *
 * Everything here is pure data + pure functions so the routine can be
 * simulated offline (wall-crossing checks) and resolved instantly for the
 * reduced-motion static scene.
 */

import { UPPER_H, iso } from "./iso";

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

type NodeDef = { u: number; v: number; h: number; room: RoomKey; pose?: Pose };

/**
 * Waypoint nodes: one standing spot per activity plus door nodes, the hall
 * spine and the stair run (h interpolates 0 → 13.2 between stairTop/Bottom).
 */
export const NODES = {
  // The sleep pose pivots here and lies along the bed's u-axis, so this spot
  // is the foot end of the mattress, centred on its v-extent.
  bed: { u: 6.2, v: 6.8, h: UPPER_H, room: "bedroom", pose: "sleep" },
  bedDoor: { u: 8, v: 12, h: UPPER_H, room: "bedroom" },
  bathSpot: { u: 20.5, v: 4.5, h: UPPER_H, room: "bath", pose: "idle" },
  bathDoor: { u: 20.5, v: 12, h: UPPER_H, room: "bath" },
  deskChair: { u: 29.8, v: 5.2, h: UPPER_H, room: "office", pose: "sit" },
  officeDoor: { u: 29.5, v: 12, h: UPPER_H, room: "office" },
  serverSpot: { u: 37, v: 7.5, h: UPPER_H, room: "server", pose: "squat" },
  serverDoor: { u: 34.5, v: 12, h: UPPER_H, room: "server" },
  stairTop: { u: 17.5, v: 13, h: UPPER_H, room: "hall" },
  stairBottom: { u: 17.5, v: 20, h: 0, room: "hall" },
  hallC: { u: 23, v: 20, h: 0, room: "hall" },
  drawDoor: { u: 23, v: 13.2, h: 0, room: "drawing" },
  sofa: { u: 22.5, v: 10.8, h: 0, room: "drawing", pose: "idle" },
  kitchenDoor: { u: 14.5, v: 7, h: 0, room: "kitchen" },
  stove: { u: 6.5, v: 3.6, h: 0, room: "kitchen", pose: "stir" },
  libDoor: { u: 30.5, v: 5, h: 0, room: "library" },
  shelf: { u: 36, v: 3.2, h: 0, room: "library", pose: "idle" },
  garageDoor: { u: 14.5, v: 20, h: 0, room: "garage" },
  bench: { u: 6, v: 17.5, h: 0, room: "garage", pose: "squat" },
  balcDoor: { u: 29.6, v: 20, h: 0, room: "balcony" },
  lounger: { u: 34.5, v: 20.5, h: 0, room: "balcony", pose: "lean" },
} satisfies Record<string, NodeDef>;

export type NodeKey = keyof typeof NODES;

const EDGES: [NodeKey, NodeKey][] = [
  ["bed", "bedDoor"],
  ["bedDoor", "bathDoor"],
  ["bathDoor", "bathSpot"],
  ["bathDoor", "officeDoor"],
  ["officeDoor", "deskChair"],
  ["officeDoor", "serverDoor"],
  ["serverDoor", "serverSpot"],
  ["bedDoor", "stairTop"],
  ["bathDoor", "stairTop"],
  ["stairTop", "stairBottom"],
  ["stairBottom", "hallC"],
  ["hallC", "drawDoor"],
  ["drawDoor", "sofa"],
  ["sofa", "kitchenDoor"],
  ["kitchenDoor", "stove"],
  ["drawDoor", "libDoor"],
  ["libDoor", "shelf"],
  ["hallC", "garageDoor"],
  ["garageDoor", "bench"],
  ["hallC", "balcDoor"],
  ["balcDoor", "lounger"],
];

function dist(a: NodeDef, b: NodeDef): number {
  return Math.hypot(a.u - b.u, a.v - b.v) + Math.abs(a.h - b.h) * 0.8;
}

/** Shortest path over the waypoint graph (Dijkstra — the graph is tiny). */
export function findPath(from: NodeKey, to: NodeKey): NodeKey[] {
  const keys = Object.keys(NODES) as NodeKey[];
  const adj = new Map<NodeKey, { n: NodeKey; w: number }[]>(keys.map((k) => [k, []]));
  for (const [a, b] of EDGES) {
    const w = dist(NODES[a], NODES[b]);
    adj.get(a)!.push({ n: b, w });
    adj.get(b)!.push({ n: a, w });
  }
  const cost = new Map<NodeKey, number>([[from, 0]]);
  const prev = new Map<NodeKey, NodeKey>();
  const open = new Set<NodeKey>([from]);
  while (open.size) {
    let cur: NodeKey | null = null;
    for (const k of open) if (cur === null || (cost.get(k) ?? Infinity) < (cost.get(cur) ?? Infinity)) cur = k;
    if (cur === null || cur === to) break;
    open.delete(cur);
    for (const { n, w } of adj.get(cur)!) {
      const c = (cost.get(cur) ?? Infinity) + w;
      if (c < (cost.get(n) ?? Infinity)) {
        cost.set(n, c);
        prev.set(n, cur);
        open.add(n);
      }
    }
  }
  const path: NodeKey[] = [to];
  while (path[0] !== from) {
    const p = prev.get(path[0]);
    if (!p) return [from, to];
    path.unshift(p);
  }
  return path;
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
  nodes: NodeKey[];
  /** Cumulative distance at each node, so position resolves by arc length. */
  cum: number[];
  total: number;
};
type Segment = Station | Walk;

/** The day compiled into stations and walks over 1440 scene minutes. */
function compileDay(): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i < SCHEDULE.length; i++) {
    const cur = SCHEDULE[i];
    const next = SCHEDULE[(i + 1) % SCHEDULE.length];
    const nextMin = i + 1 < SCHEDULE.length ? next.min : 1440;
    let stationEnd = nextMin;
    if (i + 1 < SCHEDULE.length) {
      const nodes = findPath(cur.spot, next.spot);
      const cum: number[] = [0];
      for (let j = 1; j < nodes.length; j++) {
        cum.push(cum[j - 1] + dist(NODES[nodes[j - 1]], NODES[nodes[j]]));
      }
      const total = cum[cum.length - 1];
      const walkSceneMin = (total / UNITS_PER_REAL_S) * SCENE_MIN_PER_REAL_S;
      stationEnd = Math.max(cur.min, nextMin - walkSceneMin);
      segs.push({ kind: "station", from: cur.min, until: stationEnd, node: cur.spot });
      segs.push({ kind: "walk", from: stationEnd, until: nextMin, nodes, cum, total });
    } else {
      segs.push({ kind: "station", from: cur.min, until: 1440, node: cur.spot });
    }
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

export function stateAt(minute: number): AvatarState {
  const m = ((minute % 1440) + 1440) % 1440;
  const doing = [...SCHEDULE].reverse().find((s) => s.min <= m)?.doing ?? "asleep";
  for (const seg of DAY_SEGMENTS) {
    if (m < seg.from || m >= seg.until) continue;
    if (seg.kind === "station") {
      const n: NodeDef = NODES[seg.node];
      return { u: n.u, v: n.v, h: n.h, pose: n.pose ?? "idle", facing: 1, room: n.room, doing };
    }
    const t = (m - seg.from) / (seg.until - seg.from);
    const d = t * seg.total;
    let j = 1;
    while (j < seg.cum.length - 1 && seg.cum[j] < d) j++;
    const a = NODES[seg.nodes[j - 1]];
    const b = NODES[seg.nodes[j]];
    const lt = (d - seg.cum[j - 1]) / Math.max(seg.cum[j] - seg.cum[j - 1], 1e-6);
    const u = a.u + (b.u - a.u) * lt;
    const v = a.v + (b.v - a.v) * lt;
    const h = a.h + (b.h - a.h) * lt;
    const dx = (b.u - a.u) - (b.v - a.v);
    return {
      u, v, h,
      pose: "walk",
      facing: dx >= 0 ? 1 : -1,
      room: (lt > 0.5 ? b : a).room,
      doing: "walking",
    };
  }
  const n: NodeDef = NODES.bed;
  return { u: n.u, v: n.v, h: n.h, pose: "sleep", facing: 1, room: "bedroom", doing };
}

/* ---------------- camera framing ---------------- */

/** Projected bounding box of a room (floor plus wall height), for the zoom. */
export function roomBBox(room: Room): { x: number; y: number; w: number; h: number } {
  const corners: [number, number][] = [];
  for (const h of [room.h, room.h + 9]) {
    corners.push(iso(room.u1, room.v1, h), iso(room.u2, room.v1, h), iso(room.u2, room.v2, h), iso(room.u1, room.v2, h));
  }
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
