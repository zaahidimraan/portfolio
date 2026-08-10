/**
 * The 3D house engine (E49) — a faithful port of Zahid's own
 * `house3d-twostorey.js` from his Claude Design project ("Portfolio House
 * Animation Design", db4f0279). His design chose the stack: Three.js with
 * OrbitControls, metres, y-up.
 *
 * What it does, exactly as designed: a two-storey furnished house whose
 * walls split at sill height and FADE when they face the camera (the cutaway
 * follows the orbit); an L-shaped staircase with rails; a blocky 1.72 m
 * resident who walks a waypoint graph (stairs included) on a 12-slot daily
 * schedule with walk/sit/lie/idle poses; a sky-keyframed day/night cycle
 * driving sun, lamps, screens and the server-rack glow; fly-to cameras with
 * room picking, step-inside, floor isolation (both/split/ground/upper) and
 * wall modes (cutaway/low/full).
 *
 * Adaptations for the portfolio (kept deliberately small):
 *  - scoped DOM via [data-h3d] inside the component root, no global ids
 *  - the scene clock starts at the visitor's real hour
 *  - a day/night callback so the page theme keeps following the scene's sun
 *  - reduced motion: time paused, the resident teleports instead of walking
 *  - dispose() tears everything down for React strict-mode remounts
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type House3DOptions = {
  startHour: number;
  reduced: boolean;
  onDayNight?: (day: boolean) => void;
};

export type House3DHandle = { dispose: () => void };

/* ---------- constants (metres, y-up) ---------- */
const TI = 0.12, TE = 0.2, H = 2.7, SL = 0.2, F2 = H + SL, HU = 2.55;
const CUT = 0.95; // wall split height for cutaway
const XW = 13, ZD = 9;

const C: Record<string, number | number[]> = {
  plaster: 0xf1e5cf, plaster2: 0xe4d7bc, wood: 0xc9a06a, wood2: 0xb98c5a, tile: 0xdcd4c4,
  walnut: 0xa5713f, terra: 0xc96b4a, sage: 0x7fae6a, must: 0xe7c14e, teal: 0x7fa9a3, slate: 0x37404e,
  char: 0x2b303a, white: 0xf7f2e6, steel: 0x9aa3ad, skin: 0xd9a077, hair: 0x54392a, shirt: 0xa3403a,
  jeans: 0x3f7fb5, grass: 0x93ad68, hedge: 0x6f9455, trunk: 0x7a5c38, screen: 0x1c2431, rugA: 0xc0503f,
  rugB: 0x7fa9a3, book: [0xc95f4f, 0x5f8f7a, 0xe7c14e, 0x7fa9a3, 0xb56a9f, 0x5b7fb5], ceramic: 0xf2ede1,
};

export function initHouse3D(root: HTMLElement, host: HTMLElement, opts: House3DOptions): House3DHandle | null {
  const disposers: (() => void)[] = [];
  const on = (t: EventTarget, k: string, fn: EventListenerOrEventListenerObject) => {
    t.addEventListener(k, fn);
    disposers.push(() => t.removeEventListener(k, fn));
  };
  const q = <T extends HTMLElement = HTMLElement>(name: string): T | null =>
    root.querySelector<T>(`[data-h3d="${name}"]`);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  } catch {
    return null;
  }

  const S = new THREE.Scene();
  S.background = new THREE.Color(0xcfe2f2);
  S.fog = new THREE.Fog(0xcfe2f2, 70, 155);

  const M: Record<string, THREE.MeshStandardMaterial> = {};
  const mk = (n: string, col: number, o: Record<string, unknown> = {}) =>
    (M[n] = Object.assign(new THREE.MeshStandardMaterial({ color: col, roughness: 0.88, metalness: 0, ...o }), { name: n }));
  for (const k in C) if (!Array.isArray(C[k])) mk(k, C[k] as number);
  mk("steel", C.steel as number, { roughness: 0.35, metalness: 0.55 });
  mk("glass", 0xbcd8de, { transparent: true, opacity: 0.26, roughness: 0.08, metalness: 0.1, emissive: 0x000000 });
  mk("screen", C.screen as number, { roughness: 0.3, emissive: 0x3a6fa8, emissiveIntensity: 0.9 });
  mk("scrA", 0x58d08a, { emissive: 0x58d08a, emissiveIntensity: 0.8, roughness: 0.4 });
  mk("scrB", 0x6fa2d8, { emissive: 0x6fa2d8, emissiveIntensity: 0.8, roughness: 0.4 });
  mk("lamp", 0xffe6b0, { emissive: 0xffca70, emissiveIntensity: 0.2, roughness: 0.6 });
  mk("ledG", 0x58d08a, { emissive: 0x58d08a, emissiveIntensity: 1, roughness: 0.5 });
  mk("ledY", 0xf2c14e, { emissive: 0xf2c14e, emissiveIntensity: 1, roughness: 0.5 });
  mk("ledO", 0x2a323c);
  (C.book as number[]).forEach((b, i) => mk("book" + i, b));
  const pickMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

  /* ---------- helpers ---------- */
  const G = { env: new THREE.Group(), f0: new THREE.Group(), f1: new THREE.Group(), pick: new THREE.Group() };
  G.f0.name = "groundFloor"; G.f1.name = "upperFloor";
  Object.values(G).forEach((g) => S.add(g));

  function bx(x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, m: THREE.Material, g?: THREE.Object3D, name?: string) {
    const me = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0) || 0.01, Math.abs(y1 - y0) || 0.01, Math.abs(z1 - z0) || 0.01), m);
    me.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    me.castShadow = me.receiveShadow = true; me.name = name || "part";
    (g || S).add(me); return me;
  }
  function cyl(x: number, z: number, y0: number, y1: number, r: number, m: THREE.Material, g?: THREE.Object3D, seg = 18, name?: string) {
    const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.abs(y1 - y0), seg), m);
    me.position.set(x, (y0 + y1) / 2, z); me.castShadow = me.receiveShadow = true; me.name = name || "cyl";
    (g || S).add(me); return me;
  }

  /* ---------- walls (splittable for cutaway) ---------- */
  type FadeWall = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  const fadeWalls: FadeWall[] = [];
  function seg(ax: "x" | "z", fx: number, a0: number, a1: number, y0: number, y1: number, t: number, g: THREE.Object3D, fade: { nx: number; nz: number } | null) {
    const m = fade ? M.plaster.clone() : M.plaster2;
    const me = (ax === "x" ? bx(a0, fx - t / 2, a1, fx + t / 2, y0, y1, m, g, "wall")
      : bx(fx - t / 2, a0, fx + t / 2, a1, y0, y1, m, g, "wall")) as FadeWall;
    if (fade) {
      me.userData.n = new THREE.Vector3(fade.nx, 0, fade.nz);
      me.userData.c = me.position.clone();
      m.transparent = true;
      fadeWalls.push(me);
    }
    return me;
  }
  type Op = [number, number, "w" | "d"];
  function wallRun(ax: "x" | "z", fx: number, a0: number, a1: number, y0: number, y1: number, nx: number, nz: number, t: number, ops: Op[] = [], g?: THREE.Object3D) {
    const gg = g || S;
    const list = ops.slice().sort((p, qq) => p[0] - qq[0]); let c = a0;
    const parts: [number, number, number, number][] = [];
    for (const [s, e, k] of list) {
      if (s > c + 0.001) parts.push([c, s, y0, y1]);
      if (k === "w") { parts.push([s, e, y0, y0 + 0.95]); parts.push([s, e, y0 + 2.12, y1]); }
      else parts.push([s, e, y0 + 2.06, y1]);
      c = e;
    }
    if (c < a1 - 0.001) parts.push([c, a1, y0, y1]);
    for (const [s, e, b, tp] of parts) {
      if (tp - b < 0.02) continue;
      const cut = Math.min(Math.max(y0 + CUT, b), tp);
      if (cut > b + 0.02) seg(ax, fx, s, e, b, cut, t, gg, null);
      if (tp > cut + 0.02) seg(ax, fx, s, e, cut, tp, t, gg, { nx, nz });
    }
    for (const [s, e, k] of list) {
      if (k !== "w") continue;
      const gy0 = y0 + 0.97, gy1 = y0 + 2.1, fr = 0.06;
      if (ax === "x") {
        bx(s, fx - 0.02, e, fx + 0.02, gy0, gy1, M.glass, gg, "pane");
        bx(s, fx - t / 2, s + fr, fx + t / 2, gy0, gy1, M.white, gg, "frame");
        bx(e - fr, fx - t / 2, e, fx + t / 2, gy0, gy1, M.white, gg, "frame");
        bx(s, fx - t / 2, e, fx + t / 2, gy0 - 0.05, gy0, M.white, gg, "sill");
      } else {
        bx(fx - 0.02, s, fx + 0.02, e, gy0, gy1, M.glass, gg, "pane");
        bx(fx - t / 2, s, fx + t / 2, s + fr, gy0, gy1, M.white, gg, "frame");
        bx(fx - t / 2, e - fr, fx + t / 2, e, gy0, gy1, M.white, gg, "frame");
        bx(fx - t / 2, s, fx + t / 2, e, gy0 - 0.05, gy0, M.white, gg, "sill");
      }
    }
  }

  /* ---------- plot ---------- */
  (function plot() {
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(150, 130), M.grass);
    gp.rotation.x = -Math.PI / 2; gp.position.set(6.5, -0.16, 4.5); gp.receiveShadow = true; G.env.add(gp);
    bx(-0.35, -0.35, XW + 0.35, ZD + 0.35, -0.16, 0, M.plaster2, G.env, "foundation");
    bx(5.9, ZD + 0.35, 8.1, ZD + 5.4, -0.14, -0.05, M.wood2, G.env, "path");
    for (let i = 0; i < 5; i++) bx(-2.2 - i * 0.001, -1.6, XW + 2.2, -1.1, -0.15, 0.55, M.hedge, G.env, "hedge");
    bx(-2.2, -1.6, -1.7, ZD + 4.4, -0.15, 0.55, M.hedge, G.env, "hedge");
    bx(XW + 1.7, -1.6, XW + 2.2, ZD + 4.4, -0.15, 0.55, M.hedge, G.env, "hedge");
    const tree = (x: number, z: number, s: number) => {
      cyl(x, z, -0.1, 1.1 * s, 0.16 * s, M.trunk, G.env, 10, "trunk");
      const f1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95 * s, 0), M.hedge); f1.position.set(x, 1.65 * s, z); f1.castShadow = true; G.env.add(f1);
      const f2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62 * s, 0), M.sage); f2.position.set(x + 0.35 * s, 2.35 * s, z - 0.2 * s); f2.castShadow = true; G.env.add(f2);
    };
    tree(-3.4, 2.2, 1.25); tree(-2.6, 8.6, 0.95); tree(XW + 3.2, 1.4, 1.1); tree(XW + 2.4, 9.4, 1.3);
  })();

  /* ---------- rooms ---------- */
  type Room = { n: string; f: 0 | 1; x: [number, number]; z: [number, number]; node: string; act: string; pick?: THREE.Mesh };
  const ROOMS: Record<string, Room> = {
    kitchen: { n: "Kitchen", f: 0, x: [0, 4.6], z: [0, 4.4], node: "kitchen", act: "coffee, and lunch that turns into a project" },
    lounge: { n: "Drawing room", f: 0, x: [4.6, 9.2], z: [0, 4.4], node: "lounge", act: "films, records, thinking on the sofa" },
    library: { n: "Library", f: 0, x: [9.2, 13], z: [0, 4.4], node: "library", act: "reading, notes, long-form writing" },
    garage: { n: "Garage / workshop", f: 0, x: [0, 4.6], z: [4.4, 9], node: "garage", act: "hardware, the bike, things half-built" },
    hall: { n: "Hall & stairs", f: 0, x: [4.6, 9.2], z: [4.4, 9], node: "hall", act: "coming and going" },
    balcony: { n: "Balcony / garden", f: 0, x: [9.2, 13], z: [4.4, 9], node: "balcony", act: "night air, plants, phone calls" },
    bedroom: { n: "Bedroom", f: 1, x: [0, 4.6], z: [0, 4.4], node: "bedside", act: "asleep" },
    office: { n: "Office", f: 1, x: [4.6, 9.2], z: [0, 4.4], node: "deskchair", act: "deep work — three screens, one chair" },
    server: { n: "Server room", f: 1, x: [9.2, 13], z: [0, 4.4], node: "server", act: "the box that tells you what I am doing" },
    bath: { n: "Bathroom", f: 1, x: [0, 4.6], z: [4.4, 9], node: "bath", act: "getting ready" },
    landing: { n: "Landing", f: 1, x: [4.6, 9.2], z: [4.4, 9], node: "landing", act: "passing through" },
  };

  /* ---------- floors + slabs ---------- */
  const fl = (r: Room, m: THREE.Material, y: number, g: THREE.Object3D) => bx(r.x[0], r.z[0], r.x[1], r.z[1], y - 0.04, y, m, g, "floor");
  fl(ROOMS.kitchen, M.tile, 0, G.f0); fl(ROOMS.lounge, M.wood, 0, G.f0); fl(ROOMS.library, M.wood, 0, G.f0);
  fl(ROOMS.garage, M.plaster2, 0, G.f0); fl(ROOMS.hall, M.wood, 0, G.f0);
  for (let i = 0; i < 11; i++) bx(9.25, 4.45 + i * 0.41, 12.95, 4.79 + i * 0.41, -0.04, 0.02, M.wood2, G.f0, "deck");
  ([[0, 0, XW, 4.4], [0, 4.4, 5.9, ZD], [5.9, 4.4, 9.2, 6.7], [5.9, 8.2, 9.2, ZD]] as const).forEach((p) =>
    bx(p[0], p[1], p[2], p[3], H, F2, M.plaster2, G.f1, "slab"));
  fl(ROOMS.bedroom, M.wood, F2 + 0.04, G.f1); fl(ROOMS.office, M.wood, F2 + 0.04, G.f1);
  fl(ROOMS.server, M.plaster2, F2 + 0.04, G.f1); fl(ROOMS.bath, M.tile, F2 + 0.04, G.f1); fl(ROOMS.landing, M.wood, F2 + 0.04, G.f1);

  /* ---------- walls ---------- */
  wallRun("x", 0, 0, XW, 0, H, 0, -1, TE, [[1.0, 2.6, "w"], [5.8, 7.8, "w"], [10.3, 12.3, "w"]], G.f0);
  wallRun("x", ZD, 0, 9.2, 0, H, 0, 1, TE, [[1.0, 3.4, "d"], [6.3, 7.5, "d"]], G.f0);
  wallRun("z", 0, 0, ZD, 0, H, -1, 0, TE, [[1.2, 3.0, "w"], [6.0, 7.6, "w"]], G.f0);
  wallRun("z", XW, 0, 4.4, 0, H, 1, 0, TE, [[1.4, 3.2, "w"]], G.f0);
  wallRun("z", 4.6, 0, 4.4, 0, H, 1, 0, TI, [[1.4, 2.6, "d"]], G.f0);
  wallRun("z", 9.2, 0, 4.4, 0, H, 1, 0, TI, [[1.0, 3.2, "d"]], G.f0);
  wallRun("x", 4.4, 0, 4.6, 0, H, 0, 1, TI, [[2.6, 3.9, "d"]], G.f0);
  wallRun("x", 4.4, 4.6, 9.2, 0, H, 0, 1, TI, [[5.2, 7.0, "d"]], G.f0);
  wallRun("z", 4.6, 4.4, ZD, 0, H, 1, 0, TI, [[5.4, 6.6, "d"]], G.f0);
  wallRun("z", 9.2, 4.4, ZD, 0, H, 1, 0, TI, [[5.4, 8.0, "d"]], G.f0);
  bx(9.14, 5.45, 9.26, 7.95, 0.05, 2.04, M.glass, G.f0, "patioGlass");
  bx(9.1, 5.4, 9.3, 5.5, 0.05, 2.06, M.walnut, G.f0, "patioFrame");
  bx(9.1, 7.9, 9.3, 8.0, 0.05, 2.06, M.walnut, G.f0, "patioFrame");
  bx(6.3, ZD - 0.04, 7.5, ZD + 0.06, 0, 2.06, M.terra, G.f0, "frontDoor");
  bx(7.28, ZD + 0.04, 7.42, ZD + 0.1, 0.95, 1.1, M.steel, G.f0, "handle");
  wallRun("x", 0, 0, XW, F2, F2 + HU, 0, -1, TE, [[1.0, 2.8, "w"], [5.6, 8.0, "w"]], G.f1);
  wallRun("x", ZD, 0, 9.2, F2, F2 + HU, 0, 1, TE, [[1.2, 2.6, "w"], [6.2, 7.8, "w"]], G.f1);
  wallRun("z", 0, 0, ZD, F2, F2 + HU, -1, 0, TE, [[1.2, 3.0, "w"], [6.2, 7.6, "w"]], G.f1);
  wallRun("z", XW, 0, 4.4, F2, F2 + HU, 1, 0, TE, [], G.f1);
  wallRun("z", 9.2, 4.4, ZD, F2, F2 + HU, 1, 0, TE, [[6.4, 8.0, "w"]], G.f1);
  wallRun("z", 4.6, 0, 4.4, F2, F2 + HU, 1, 0, TI, [[1.4, 2.6, "d"]], G.f1);
  wallRun("z", 9.2, 0, 4.4, F2, F2 + HU, 1, 0, TI, [[0.9, 2.9, "d"]], G.f1);
  wallRun("x", 4.4, 0, 4.6, F2, F2 + HU, 0, 1, TI, [[2.8, 4.0, "d"]], G.f1);
  wallRun("x", 4.4, 4.6, 9.2, F2, F2 + HU, 0, 1, TI, [[5.0, 6.2, "d"]], G.f1);
  wallRun("z", 4.6, 4.4, ZD, F2, F2 + HU, 1, 0, TI, [[5.4, 6.6, "d"]], G.f1);

  /* ---------- stairs (15 risers, L-shape with landing) ---------- */
  (function stairs() {
    const rise = 2.9 / 15, w = 1.15, x0 = 7.9, x1 = x0 + w;
    for (let i = 0; i < 8; i++) {
      const z = 4.55 + i * 0.2875, y = (i + 1) * rise;
      bx(x0, z, x1, z + 0.2875, y - 0.05, y, M.wood, G.f0, "tread");
      bx(x0, z, x1, z + 0.04, y - rise, y - 0.05, M.plaster2, G.f0, "riser");
    }
    bx(x0, 6.85, x1, 8.0, 1.49, 1.547, M.wood, G.f0, "landing");
    bx(x0, 6.85, x1, 8.0, 0, 1.49, M.plaster2, G.f0, "landingBox");
    for (let i = 0; i < 7; i++) {
      const xa = x0 - (i + 1) * 0.2857, y = 1.547 + (i + 1) * rise;
      bx(xa, 6.85, xa + 0.2857, 8.0, y - 0.05, y, M.wood, G.f0, "tread");
      bx(xa + 0.2857 - 0.04, 6.85, xa + 0.2857, 8.0, y - rise, y - 0.05, M.plaster2, G.f0, "riser");
    }
    const rail = (ax: "x" | "z", f: number, a0: number, a1: number, y0: number, y1: number) => {
      const n = Math.max(2, Math.round(Math.abs(a1 - a0) / 0.42));
      for (let i = 0; i <= n; i++) {
        const t = i / n, a = a0 + (a1 - a0) * t, y = y0 + (y1 - y0) * t;
        if (ax === "z") cyl(f, a, y, y + 0.86, 0.022, M.steel, G.f0, 8, "baluster");
        else cyl(a, f, y, y + 0.86, 0.022, M.steel, G.f0, 8, "baluster");
      }
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n;
        const a = a0 + (a1 - a0) * (t0 + t1) / 2, y = y0 + (y1 - y0) * (t0 + t1) / 2 + 0.89;
        const len = Math.abs(a1 - a0) / n + 0.04, dy = (y1 - y0) / n;
        const me = new THREE.Mesh(new THREE.BoxGeometry(ax === "z" ? 0.05 : len, 0.05, ax === "z" ? len : 0.05), M.walnut);
        me.position.set(ax === "z" ? f : a, y, ax === "z" ? a : f);
        me.rotation[ax === "z" ? "x" : "z"] = ax === "z" ? -Math.atan2(dy, len) : Math.atan2(dy, len);
        me.castShadow = true; G.f0.add(me);
      }
    };
    rail("z", 7.9 - 0.06, 4.6, 6.85, 0.2, 1.6); rail("x", 8.06, 7.9, 5.95, 1.6, 2.95);
    for (const p of [6.7, 8.2]) {
      const n = 8;
      for (let i = 0; i <= n; i++) cyl(5.95 + (9.15 - 5.95) * i / n, p, F2, F2 + 0.9, 0.022, M.steel, G.f1, 8, "baluster");
      bx(5.95, p - 0.03, 9.15, p + 0.03, F2 + 0.9, F2 + 0.95, M.walnut, G.f1, "rail");
    }
  })();

  /* ---------- furniture (verbatim from the design) ---------- */
  function kitchen(g: THREE.Object3D) {
    bx(0.1, 0.1, 3.2, 0.8, 0, 0.88, M.white, g, "counter"); bx(0.1, 0.1, 3.2, 0.8, 0.88, 0.93, M.slate, g, "worktop");
    bx(0.1, 0.8, 0.8, 3.0, 0, 0.88, M.white, g, "counter"); bx(0.1, 0.8, 0.8, 3.0, 0.88, 0.93, M.slate, g, "worktop");
    bx(1.2, 0.12, 2.2, 0.72, 0.9, 0.95, M.steel, g, "sink");
    cyl(1.7, 0.3, 0.95, 1.25, 0.03, M.steel, g, 10, "tap");
    bx(2.4, 0.14, 3.1, 0.74, 0.93, 0.99, M.char, g, "hob");
    bx(2.3, 0.1, 3.2, 0.78, 1.75, 2.35, M.white, g, "cabinet"); bx(0.1, 0.1, 1.9, 0.78, 1.75, 2.35, M.white, g, "cabinet");
    bx(3.5, 0.12, 4.5, 1.0, 0, 1.9, M.plaster, g, "fridge"); bx(3.98, 1.0, 4.06, 1.03, 0.9, 1.4, M.steel, g, "fridgeHandle");
    bx(1.1, 2.2, 3.6, 3.2, 0.05, 0.88, M.walnut, g, "island"); bx(1.0, 2.1, 3.7, 3.3, 0.88, 0.95, M.wood, g, "islandTop");
    [1.6, 3.1].forEach((x) => { cyl(x, 3.7, 0, 0.62, 0.05, M.steel, g, 10, "stoolStem"); cyl(x, 3.7, 0.62, 0.7, 0.19, M.terra, g, 14, "stoolSeat"); });
    cyl(2.9, 2.7, 0.95, 1.15, 0.11, M.terra, g, 14, "pot"); bx(1.3, 2.5, 1.7, 2.9, 0.95, 1.15, M.sage, g, "bowl");
    bx(0.4, 3.6, 1.0, 4.2, 0, 0.9, M.hedge, g, "plantPot");
  }
  function lounge(g: THREE.Object3D) {
    bx(5.1, 2.6, 8.7, 4.1, 0.001, 0.02, M.rugA, g, "rug");
    bx(5.2, 3.2, 8.6, 4.15, 0.1, 0.42, M.teal, g, "sofaBase"); bx(5.2, 3.85, 8.6, 4.15, 0.42, 1.0, M.teal, g, "sofaBack");
    bx(5.2, 3.2, 5.55, 4.15, 0.42, 0.78, M.teal, g, "sofaArm"); bx(8.25, 3.2, 8.6, 4.15, 0.42, 0.78, M.teal, g, "sofaArm");
    [5.8, 7.9].forEach((x) => bx(x, 3.5, x + 0.55, 4.05, 0.42, 0.52, M.must, g, "cushion"));
    bx(6.2, 2.5, 7.9, 3.1, 0.05, 0.38, M.walnut, g, "coffeeTable"); bx(6.1, 2.4, 8.0, 3.2, 0.38, 0.44, M.wood, g, "tableTop");
    bx(6.6, 2.65, 7.2, 2.95, 0.44, 0.5, M.white, g, "books");
    bx(5.3, 0.15, 8.5, 0.55, 0.35, 0.75, M.walnut, g, "mediaUnit");
    bx(5.9, 0.18, 8.0, 0.3, 1.0, 2.15, M.char, g, "tvFrame"); bx(5.98, 0.3, 7.92, 0.34, 1.08, 2.07, M.screen, g, "tvScreen");
    cyl(8.75, 1.0, 0, 1.55, 0.04, M.steel, g, 10, "lampStem"); cyl(8.75, 1.0, 1.55, 1.85, 0.22, M.lamp, g, 16, "lampShade");
    bx(4.95, 1.1, 5.45, 1.6, 0, 0.45, M.terra, g, "plantPot"); cyl(5.2, 1.35, 0.45, 1.35, 0.06, M.trunk, g, 8, "stem");
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), M.sage); f.position.set(5.2, 1.6, 1.35); f.castShadow = true; g.add(f);
    bx(6.8, 0.9, 7.6, 1.6, 0.001, 0.02, M.rugB, g, "matSmall");
  }
  function library(g: THREE.Object3D) {
    bx(9.4, 0.25, 12.8, 0.55, 0, 2.45, M.walnut, g, "shelfCase");
    for (let s = 0; s < 5; s++) {
      const y = 0.35 + s * 0.42; bx(9.45, 0.25, 12.75, 0.5, y, y + 0.04, M.wood, g, "shelf");
      for (let i = 0; i < 22; i++) bx(9.5 + i * 0.148, 0.27, 9.5 + i * 0.148 + 0.12, 0.48, y + 0.04, y + 0.04 + (0.22 + (i % 3) * 0.05), M["book" + ((i + s) % 6)], g, "book");
    }
    bx(12.55, 0.6, 12.85, 4.2, 0, 2.45, M.walnut, g, "shelfCase");
    for (let s = 0; s < 5; s++) { const y = 0.35 + s * 0.42; for (let i = 0; i < 17; i++) bx(12.6, 0.75 + i * 0.19, 12.82, 0.75 + i * 0.19 + 0.15, y + 0.04, y + 0.3, M["book" + ((i + s * 2) % 6)], g, "book"); }
    bx(9.9, 2.9, 11.0, 4.0, 0.1, 0.42, M.terra, g, "chairSeat"); bx(9.9, 3.75, 11.0, 4.05, 0.42, 1.05, M.terra, g, "chairBack");
    bx(9.9, 2.9, 10.1, 4.0, 0.42, 0.68, M.terra, g, "chairArm"); bx(10.8, 2.9, 11.0, 4.0, 0.42, 0.68, M.terra, g, "chairArm");
    bx(11.3, 3.2, 11.9, 3.8, 0.05, 0.52, M.walnut, g, "sideTable");
    cyl(11.6, 3.5, 0.52, 0.95, 0.03, M.steel, g, 10, "lampStem"); cyl(11.6, 3.5, 0.95, 1.2, 0.17, M.lamp, g, 14, "lampShade");
    bx(9.6, 2.4, 11.6, 4.3, 0.001, 0.02, M.rugB, g, "rug");
    bx(11.9, 1.0, 12.4, 1.5, 0, 0.5, M.sage, g, "plantPot");
  }
  function garage(g: THREE.Object3D) {
    bx(0.15, 8.2, 4.4, 8.85, 0, 0.9, M.wood2, g, "bench"); bx(0.1, 8.15, 4.45, 8.9, 0.9, 0.96, M.walnut, g, "benchTop");
    bx(0.4, 8.3, 1.5, 8.75, 0.96, 1.1, M.steel, g, "vice");
    bx(0.2, 8.72, 4.3, 8.8, 1.5, 2.4, M.plaster2, g, "pegboard");
    for (let i = 0; i < 12; i++) bx(0.45 + i * 0.32, 8.68, 0.45 + i * 0.32 + 0.07, 8.74, 1.6 + (i % 3) * 0.22, 2.05 + (i % 4) * 0.1, M["book" + (i % 6)], g, "tool");
    bx(2.2, 8.1, 3.1, 8.16, 1.15, 1.5, M.steel, g, "shelfRail");
    ([[0.35, 5.0], [1.35, 5.0], [0.35, 6.0]] as const).forEach(([x, z]) => bx(x, z, x + 0.85, z + 0.85, 0, 0.55, M.must, g, "crate"));
    bx(3.3, 4.7, 4.4, 5.9, 0, 1.75, M.slate, g, "cabinet");
    for (let i = 0; i < 3; i++) bx(3.35, 4.75, 4.38, 5.85, 0.12 + i * 0.55, 0.15 + i * 0.55 + 0.42, M.steel, g, "drawer");
    const wheel = (x: number, z: number) => {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.045, 8, 24), M.char);
      w.position.set(x, 0.38, z); w.rotation.y = Math.PI / 2; w.castShadow = true; g.add(w);
    };
    wheel(1.9, 6.3); wheel(1.9, 7.5);
    bx(1.86, 6.4, 1.94, 7.45, 0.55, 0.62, M.terra, g, "bikeFrame"); bx(1.86, 6.9, 1.94, 7.0, 0.62, 1.0, M.terra, g, "bikeSeatPost");
    bx(1.78, 6.85, 2.02, 7.05, 1.0, 1.06, M.char, g, "bikeSeat"); bx(1.7, 7.4, 2.1, 7.5, 1.02, 1.08, M.steel, g, "bars");
    bx(3.4, 7.6, 4.3, 8.0, 0, 0.35, M.hedge, g, "toolbox");
  }
  function balconyF(g: THREE.Object3D) {
    const n = 9;
    for (let i = 0; i <= n; i++) cyl(9.3 + (12.9 - 9.3) * i / n, 8.92, 0.02, 0.92, 0.025, M.steel, g, 8, "baluster");
    for (let i = 0; i <= 7; i++) cyl(12.9, 4.6 + (8.92 - 4.6) * i / 7, 0.02, 0.92, 0.025, M.steel, g, 8, "baluster");
    bx(9.25, 8.86, 12.95, 8.98, 0.92, 0.99, M.walnut, g, "rail"); bx(12.84, 4.55, 12.96, 8.98, 0.92, 0.99, M.walnut, g, "rail");
    bx(9.6, 6.6, 11.4, 8.3, 0.06, 0.3, M.wood2, g, "lounger"); bx(9.6, 7.9, 11.4, 8.3, 0.3, 0.95, M.wood2, g, "loungerBack");
    bx(9.7, 6.7, 11.3, 8.0, 0.3, 0.38, M.must, g, "cushion");
    bx(11.8, 6.9, 12.4, 7.5, 0.06, 0.45, M.walnut, g, "sideTable");
    cyl(12.1, 7.2, 0.45, 0.58, 0.06, M.ceramic, g, 12, "cup");
    ([[9.5, 4.7], [10.6, 4.7], [11.7, 4.7]] as const).forEach(([x, z], i) => {
      bx(x, z, x + 0.8, z + 0.8, 0.02, 0.5, M.terra, g, "planter");
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 + i * 0.05, 0), i === 1 ? M.hedge : M.sage);
      f.position.set(x + 0.4, 0.85, z + 0.4); f.castShadow = true; g.add(f);
    });
    for (let i = 0; i < 7; i++) { const t = i / 6, x = 9.4 + t * 3.4, y = 2.4 - Math.sin(t * Math.PI) * 0.38; cyl(x, 8.7, y, y + 0.1, 0.045, M.lamp, g, 8, "bulb"); }
  }
  function hallF(g: THREE.Object3D) {
    bx(5.0, 4.6, 6.4, 5.0, 0.05, 0.78, M.walnut, g, "console"); bx(4.95, 4.55, 6.45, 5.05, 0.78, 0.84, M.wood, g, "consoleTop");
    bx(5.4, 4.62, 5.9, 4.9, 0.84, 0.96, M.sage, g, "bowl");
    bx(4.72, 7.6, 4.78, 8.6, 1.6, 1.7, M.walnut, g, "coatRail");
    bx(4.78, 7.7, 5.05, 7.95, 1.15, 1.65, M.terra, g, "coat"); bx(4.78, 8.2, 5.02, 8.4, 1.25, 1.62, M.slate, g, "coat");
    bx(6.2, 7.9, 7.8, 8.8, 0.001, 0.02, M.rugA, g, "mat");
    bx(5.05, 5.6, 5.55, 6.1, 0, 0.5, M.hedge, g, "plantPot");
  }
  function bedroom(g: THREE.Object3D) {
    const y = F2 + 0.04;
    bx(0.5, 0.5, 3.0, 0.95, y, y + 0.02, M.wood2, g, "bedBase");
    bx(0.5, 0.5, 3.0, 2.55, y, y + 0.38, M.walnut, g, "bedFrame");
    bx(0.55, 0.55, 2.95, 2.5, y + 0.38, y + 0.62, M.white, g, "mattress");
    bx(0.5, 0.45, 3.0, 0.58, y, y + 1.0, M.walnut, g, "headboard");
    bx(0.6, 0.62, 1.65, 1.05, y + 0.62, y + 0.76, M.white, g, "pillow"); bx(1.85, 0.62, 2.9, 1.05, y + 0.62, y + 0.76, M.white, g, "pillow");
    bx(0.55, 1.15, 2.95, 2.5, y + 0.62, y + 0.74, M.terra, g, "duvet");
    bx(3.25, 0.5, 3.95, 1.2, y, y + 0.5, M.walnut, g, "nightstand");
    cyl(3.6, 0.85, y + 0.5, y + 0.78, 0.03, M.steel, g, 10, "lampStem"); cyl(3.6, 0.85, y + 0.78, y + 0.98, 0.15, M.lamp, g, 14, "lampShade");
    bx(3.3, 2.6, 4.45, 4.25, y, y + 2.1, M.plaster, g, "wardrobe");
    bx(3.85, 2.55, 3.91, 4.2, y, y + 2.1, M.walnut, g, "wardrobeSplit");
    bx(0.6, 2.8, 2.9, 4.2, y, y + 0.02, M.rugB, g, "rug");
    bx(0.5, 3.4, 1.3, 4.2, y, y + 0.45, M.sage, g, "plantPot");
  }
  function office(g: THREE.Object3D) {
    const y = F2 + 0.04, dz0 = 0.28, dz1 = 1.0, dy = y + 0.74;
    bx(4.95, dz0, 8.9, dz1, dy - 0.05, dy, M.walnut, g, "deskTop");
    [5.1, 8.6].forEach((x) => { bx(x - 0.05, dz0 + 0.05, x + 0.05, dz1 - 0.05, y, dy - 0.05, M.slate, g, "deskLeg"); });
    bx(4.95, dz0, 8.9, dz0 + 0.06, y + 0.3, dy - 0.06, M.slate, g, "deskPanel");
    const mon = (xc: number, w: number, h: number, tilt: THREE.Material) => {
      bx(xc - 0.09, dz0 + 0.16, xc + 0.09, dz0 + 0.28, dy, dy + 0.05, M.char, g, "monFoot");
      bx(xc - 0.03, dz0 + 0.2, xc + 0.03, dz0 + 0.24, dy + 0.05, dy + 0.3, M.char, g, "monStem");
      bx(xc - w / 2, dz0 + 0.16, xc + w / 2, dz0 + 0.21, dy + 0.3, dy + 0.3 + h, M.char, g, "monBack");
      bx(xc - w / 2 + 0.03, dz0 + 0.12, xc + w / 2 - 0.03, dz0 + 0.16, dy + 0.33, dy + 0.27 + h, tilt, g, "monScreen");
    };
    mon(5.75, 1.0, 0.58, M.screen); mon(6.95, 1.22, 0.68, M.screen); mon(8.15, 0.62, 0.82, M.scrA);
    for (let i = 0; i < 6; i++) bx(6.45 + (i % 2) * 0.3, dz0 + 0.11, 6.45 + (i % 2) * 0.3 + 0.22, dz0 + 0.115, dy + 0.5 + i * 0.07, dy + 0.53 + i * 0.07, i % 2 ? M.scrB : M.scrA, g, "codeLine");
    bx(6.5, 1.15, 7.6, 1.45, dy, dy + 0.03, M.char, g, "keyboard");
    for (let i = 0; i < 10; i++) bx(6.55 + i * 0.105, 1.19, 6.55 + i * 0.105 + 0.08, 1.41, dy + 0.03, dy + 0.036, M.slate, g, "keys");
    bx(7.8, 1.2, 7.98, 1.42, dy, dy + 0.035, M.slate, g, "mouse");
    cyl(5.45, 1.25, dy, dy + 0.11, 0.045, M.terra, g, 12, "mug");
    bx(8.35, 1.1, 8.8, 1.55, dy, dy + 0.28, M.wood, g, "notebook");
    const cx = 7.05, cz = 1.95;
    cyl(cx, cz, y, y + 0.04, 0.32, M.char, g, 16, "chairBase");
    cyl(cx, cz, y + 0.04, y + 0.44, 0.05, M.steel, g, 12, "chairStem");
    bx(cx - 0.28, cz - 0.28, cx + 0.28, cz + 0.28, y + 0.44, y + 0.52, M.slate, g, "chairSeat");
    bx(cx - 0.28, cz + 0.2, cx + 0.28, cz + 0.28, y + 0.52, y + 1.12, M.slate, g, "chairBack");
    bx(cx - 0.36, cz - 0.16, cx - 0.28, cz + 0.16, y + 0.68, y + 0.74, M.char, g, "armrest");
    bx(cx + 0.28, cz - 0.16, cx + 0.36, cz + 0.16, y + 0.68, y + 0.74, M.char, g, "armrest");
    bx(4.9, 2.9, 5.0, 4.3, y + 1.2, y + 1.28, M.wood, g, "shelf");
    for (let i = 0; i < 5; i++) bx(4.9, 3.0 + i * 0.25, 5.02, 3.0 + i * 0.25 + 0.18, y + 1.28, y + 1.28 + 0.22 + (i % 2) * 0.08, M["book" + (i % 6)], g, "box");
    bx(8.5, 3.6, 9.05, 4.15, y, y + 0.45, M.terra, g, "plantPot");
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), M.sage); f.position.set(8.78, y + 0.8, 3.88); f.castShadow = true; g.add(f);
    bx(5.3, 2.4, 7.9, 4.1, y, y + 0.02, M.rugA, g, "rug");
  }
  function server(g: THREE.Object3D) {
    const y = F2 + 0.04;
    bx(9.5, 0.35, 11.2, 1.25, y, y + 2.1, M.slate, g, "rack");
    bx(9.55, 1.25, 11.15, 1.28, y + 0.1, y + 2.05, M.char, g, "rackFront");
    for (let r = 0; r < 9; r++) for (let i = 0; i < 6; i++) {
      const m = [M.ledG, M.ledY, M.ledO][(r * 2 + i) % 3];
      bx(9.7 + i * 0.24, 1.27, 9.7 + i * 0.24 + 0.12, 1.3, y + 0.28 + r * 0.19, y + 0.28 + r * 0.19 + 0.05, m, g, "led");
    }
    bx(9.5, 2.0, 10.4, 2.6, y, y + 0.55, M.slate, g, "ups");
    bx(11.6, 1.4, 12.9, 2.4, y, y + 0.74, M.walnut, g, "deskCrt");
    bx(11.8, 1.55, 12.7, 2.25, y + 0.74, y + 1.14, M.plaster, g, "crtBody");
    bx(11.85, 1.5, 12.65, 1.56, y + 0.8, y + 1.1, M.scrA, g, "crtScreen");
    bx(11.85, 2.3, 12.6, 2.6, y + 0.74, y + 0.78, M.char, g, "crtKeyboard");
    for (let i = 0; i < 4; i++) bx(9.55, 3.0 + i * 0.02, 12.8, 3.06 + i * 0.02, y + 1.5 + i * 0.12, y + 1.54 + i * 0.12, M.steel, g, "cableTray");
    bx(12.3, 3.4, 12.9, 4.0, y, y + 0.6, M.char, g, "fan");
    cyl(12.6, 3.4, y + 0.3, y + 0.32, 0.24, M.steel, g, 16, "fanBlade");
  }
  function bath(g: THREE.Object3D) {
    const y = F2 + 0.04;
    bx(0.3, 4.7, 2.1, 6.5, y, y + 0.55, M.ceramic, g, "tub"); bx(0.42, 4.82, 1.98, 6.38, y + 0.12, y + 0.48, M.glass, g, "water");
    cyl(1.2, 4.9, y + 0.55, y + 0.95, 0.03, M.steel, g, 10, "tapTub");
    bx(0.3, 7.2, 1.5, 7.9, y, y + 0.8, M.white, g, "vanity"); bx(0.25, 7.15, 1.55, 7.95, y + 0.8, y + 0.86, M.slate, g, "vanityTop");
    cyl(0.9, 7.55, y + 0.86, y + 0.94, 0.2, M.ceramic, g, 16, "basin");
    bx(0.35, 7.2, 1.45, 7.24, y + 1.1, y + 1.9, M.glass, g, "mirror");
    bx(2.6, 7.9, 3.2, 8.6, y, y + 0.42, M.ceramic, g, "toilet"); bx(2.6, 8.5, 3.2, 8.66, y + 0.42, y + 0.82, M.ceramic, g, "cistern");
    bx(2.0, 5.0, 2.06, 6.0, y + 1.35, y + 1.42, M.steel, g, "towelRail");
    bx(1.86, 5.1, 2.04, 5.5, y + 0.95, y + 1.4, M.teal, g, "towel"); bx(1.86, 5.6, 2.04, 5.95, y + 1.0, y + 1.4, M.terra, g, "towel");
    bx(1.9, 6.9, 3.0, 7.8, y, y + 0.02, M.rugB, g, "mat");
    bx(3.5, 4.8, 4.1, 5.4, y, y + 0.5, M.hedge, g, "plantPot");
  }
  function landingF(g: THREE.Object3D) {
    const y = F2 + 0.04;
    bx(4.85, 5.0, 5.6, 5.5, y, y + 0.8, M.walnut, g, "sideboard");
    bx(4.9, 8.2, 6.2, 8.28, y + 1.3, y + 2.0, M.plaster2, g, "artFrame");
    bx(6.6, 8.4, 7.6, 8.85, y, y + 0.02, M.rugB, g, "runner");
    bx(8.6, 4.6, 9.1, 5.1, y, y + 0.45, M.sage, g, "plantPot");
  }
  kitchen(G.f0); lounge(G.f0); library(G.f0); garage(G.f0); balconyF(G.f0); hallF(G.f0);
  bedroom(G.f1); office(G.f1); server(G.f1); bath(G.f1); landingF(G.f1);

  /* ---------- pickers ---------- */
  for (const k in ROOMS) {
    const r = ROOMS[k], y = r.f ? F2 : 0;
    const p = bx(r.x[0] + 0.05, r.z[0] + 0.05, r.x[1] - 0.05, r.z[1] - 0.05, y + 0.02, y + 2.3, pickMat, G.pick, "pick_" + k);
    p.castShadow = p.receiveShadow = false; p.userData.room = k; p.userData.y0 = p.position.y; r.pick = p;
  }

  /* ---------- avatar (1.72 m, blocky) ---------- */
  const AV = new THREE.Group(); AV.name = "avatar"; S.add(AV);
  const body = new THREE.Group(); AV.add(body);
  bx(-0.21, -0.12, 0.21, 0.12, 0.82, 1.40, M.shirt, body, "torso");
  bx(-0.145, -0.075, 0.145, 0.075, 1.40, 1.46, M.skin, body, "neck");
  bx(-0.15, -0.14, 0.15, 0.14, 1.46, 1.74, M.skin, body, "head");
  bx(-0.155, -0.145, 0.155, 0.145, 1.665, 1.755, M.hair, body, "hair");
  bx(-0.155, 0.05, 0.155, 0.15, 1.50, 1.70, M.hair, body, "hairBack");
  bx(-0.09, -0.152, 0.09, -0.145, 1.545, 1.575, M.hair, body, "brow");
  const limb = (x: number, y: number, len: number, w: number, m: THREE.Material, name: string) => {
    const p = new THREE.Group(); p.position.set(x, y, 0); body.add(p);
    bx(-w / 2, -w / 2, w / 2, w / 2, -len, 0, m, p, name); return p;
  };
  const legL = limb(-0.11, 0.82, 0.82, 0.17, M.jeans, "legL"), legR = limb(0.11, 0.82, 0.82, 0.17, M.jeans, "legR");
  const armL = limb(-0.255, 1.36, 0.58, 0.13, M.shirt, "armL"), armR = limb(0.255, 1.36, 0.58, 0.13, M.shirt, "armR");
  bx(-0.08, -0.07, 0.08, 0.07, -0.82, -0.76, M.char, legL, "shoeL"); bx(-0.08, -0.07, 0.08, 0.07, -0.82, -0.76, M.char, legR, "shoeR");
  bx(-0.07, -0.065, 0.07, 0.065, -0.58, -0.5, M.skin, armL, "handL"); bx(-0.07, -0.065, 0.07, 0.065, -0.58, -0.5, M.skin, armR, "handR");
  AV.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });

  /* ---------- waypoint graph ---------- */
  const N: Record<string, [number, number, number]> = {
    kitchen: [2.3, 0, 2.2], kdoor: [4.6, 0, 2.0], lounge: [6.9, 0, 2.0], libdoor: [9.2, 0, 2.1], library: [11.0, 0, 2.3],
    loungeHall: [6.1, 0, 4.4], hall: [7.0, 0, 6.0], gdoor: [4.6, 0, 6.0], garage: [2.3, 0, 6.6],
    patio: [9.2, 0, 6.7], balcony: [11.0, 0, 6.9], front: [6.9, 0, 8.5],
    st0: [8.47, 0, 4.75], st1: [8.47, 1.547, 6.9], st2: [8.47, 1.547, 7.42], st3: [5.95, 2.9, 7.42],
    landing: [5.4, 2.9, 6.5], bathdoor: [4.6, 2.9, 6.0], bath: [1.6, 2.9, 6.6],
    odoor: [5.6, 2.9, 4.4], office: [6.4, 2.9, 3.0], deskchair: [7.05, 2.9, 2.6],
    beddoorO: [4.6, 2.9, 2.0], bedroom: [2.2, 2.9, 3.4], bedside: [1.75, 2.9, 1.6],
    beddoorB: [3.4, 2.9, 4.4], sdoor: [9.2, 2.9, 1.9], server: [11.0, 2.9, 2.6],
  };
  const E: [string, string][] = [["kitchen", "kdoor"], ["kdoor", "lounge"], ["lounge", "libdoor"], ["libdoor", "library"], ["lounge", "loungeHall"],
    ["loungeHall", "hall"], ["hall", "gdoor"], ["gdoor", "garage"], ["hall", "patio"], ["patio", "balcony"], ["hall", "front"],
    ["hall", "st0"], ["st0", "st1"], ["st1", "st2"], ["st2", "st3"], ["st3", "landing"], ["landing", "bathdoor"], ["bathdoor", "bath"],
    ["landing", "odoor"], ["odoor", "office"], ["office", "deskchair"], ["office", "beddoorO"], ["beddoorO", "bedroom"],
    ["bedroom", "bedside"], ["bedroom", "beddoorB"], ["beddoorB", "bathdoor"], ["office", "sdoor"], ["sdoor", "server"]];
  const ADJ: Record<string, string[]> = {};
  E.forEach(([a, b]) => { (ADJ[a] = ADJ[a] || []).push(b); (ADJ[b] = ADJ[b] || []).push(a); });
  function path(a: string, b: string): string[] {
    if (a === b) return [b];
    const queue = [a]; const prev: Record<string, string | null> = { [a]: null };
    while (queue.length) {
      const u = queue.shift()!;
      if (u === b) break;
      for (const v of ADJ[u] || []) if (!(v in prev)) { prev[v] = u; queue.push(v); }
    }
    if (!(b in prev)) return [b];
    const out: string[] = [];
    for (let u: string | null = b; u; u = prev[u]) out.unshift(u);
    return out.slice(1);
  }

  /* ---------- schedule ---------- */
  type Slot = [number, string, string, string];
  const SCHED: Slot[] = [[0, "bedroom", "asleep", "bedside"], [7.4, "bath", "getting ready", "bath"], [8.1, "kitchen", "coffee + breakfast", "kitchen"],
    [9, "office", "deep work", "deskchair"], [13, "kitchen", "lunch", "kitchen"], [14, "office", "client work", "deskchair"],
    [17, "library", "reading", "library"], [18.4, "garage", "tinkering", "garage"], [20, "kitchen", "cooking dinner", "kitchen"],
    [21, "lounge", "film + records", "lounge"], [22.6, "balcony", "night air", "balcony"], [23.2, "bedroom", "asleep", "bedside"]];
  const slotAt = (h: number) => { let s = SCHED[0]; for (const e of SCHED) if (h >= e[0]) s = e; return s; };

  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight(0xcfe2f2, 0x8a7f68, 0.85); S.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -16; sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -14; sun.shadow.camera.far = 70; sun.shadow.bias = -0.0009;
  sun.target.position.set(6.5, 1, 4.5); S.add(sun, sun.target);
  const amb = new THREE.AmbientLight(0xffffff, 0.22); S.add(amb);
  const roomLamp = new THREE.PointLight(0xffc98a, 0, 7.5, 2); S.add(roomLamp);
  const focusLamp = new THREE.PointLight(0xffe4c0, 0, 9, 2); S.add(focusLamp);
  const rackGlow = new THREE.PointLight(0x7fb8ff, 0.5, 5, 2); rackGlow.position.set(10.4, F2 + 1.3, 1.6); S.add(rackGlow);

  /* ---------- renderer / camera / controls ---------- */
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(23, 10.5, 24.5);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(6.5, 1.9, 4.5);
  controls.enableDamping = true; controls.dampingFactor = 0.075; controls.screenSpacePanning = true;
  controls.minDistance = 1.5; controls.maxDistance = 52; controls.minPolarAngle = 0.1; controls.maxPolarAngle = 1.45;
  controls.zoomSpeed = 0.8; controls.rotateSpeed = 0.8; controls.panSpeed = 0.8;
  function resize() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
  on(window, "resize", resize);
  const ro = new ResizeObserver(resize); ro.observe(host); disposers.push(() => ro.disconnect());
  resize();

  /* ---------- state ---------- */
  const st = {
    t: opts.startHour, run: !opts.reduced, speed: 24 / 190, walls: "cutaway", floor: "both",
    focus: null as string | null, inside: false, node: "deskchair", queue: [] as string[],
    pose: "sit", from: null as number[] | null, prog: 0, phase: 0, baseY: F2, off: 0, offT: 0,
  };

  let tween: { k: number; dur: number; ft: THREE.Vector3; fp: THREE.Vector3; tt: THREE.Vector3; tp: THREE.Vector3 } | null = null;
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  function flyTo(tgt: THREE.Vector3, pos: THREE.Vector3, dur = 0.95) {
    tween = { k: 0, dur, ft: controls.target.clone(), fp: camera.position.clone(), tt: tgt, tp: pos };
  }

  /* ---------- UI ---------- */
  const ui = {
    clock: q("clock"), nowRoom: q("nowRoom"), nowAct: q("nowAct"),
    slider: q<HTMLInputElement>("timeSlider"), sched: q("sched"), chip: q("chip"),
    chipName: q("chipName"), chipAct: q("chipAct"),
    wallBtns: [...root.querySelectorAll<HTMLButtonElement>("[data-wall]")],
    floorBtns: [...root.querySelectorAll<HTMLButtonElement>("[data-floor]")],
    roomBtns: [...root.querySelectorAll<HTMLButtonElement>("[data-room]")],
    play: q<HTMLButtonElement>("play"), insideBtn: q<HTMLButtonElement>("insideBtn"),
  };
  const paint = (b: HTMLButtonElement, isOn: boolean) => { b.style.background = isOn ? "#37404e" : "transparent"; b.style.color = isOn ? "#fff" : "var(--h3d-ink)"; };

  function focusRoom(k: string, inside?: boolean) {
    const r = ROOMS[k]; if (!r) return;
    st.focus = k; st.inside = !!inside;
    if (st.floor !== "split") { if (r.f === 1) setFloor("upper"); else setFloor("ground"); }
    const cx = (r.x[0] + r.x[1]) / 2, cz = (r.z[0] + r.z[1]) / 2;
    const base = r.f ? F2 + st.offT : 0;
    const size = Math.max(r.x[1] - r.x[0], r.z[1] - r.z[0]);
    const th = Math.atan2(
      (Math.sign(cx - XW / 2) || 1) * Math.max(Math.abs(cx - XW / 2), 2),
      (Math.sign(cz - ZD / 2) || 1) * Math.max(Math.abs(cz - ZD / 2), 2),
    );
    let tgt: THREE.Vector3, pos: THREE.Vector3;
    if (inside) {
      tgt = new THREE.Vector3(cx, base + 1.15, cz);
      pos = tgt.clone().add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(size * 0.5 + 1.9, 1.36, th)));
    } else {
      tgt = new THREE.Vector3(cx, base + 1.05, cz);
      pos = tgt.clone().add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(size * 0.82 + 2.6, 1.0, th)));
    }
    flyTo(tgt, pos);
    if (ui.chip) ui.chip.style.display = "flex";
    if (ui.chipName) ui.chipName.textContent = r.n;
    if (ui.chipAct) ui.chipAct.textContent = r.act;
    ui.roomBtns.forEach((b) => {
      const isOn = b.dataset.room === k;
      b.style.background = isOn ? "#c96b4a" : "transparent";
      b.style.color = isOn ? "#fff" : "var(--h3d-ink)";
      b.style.borderColor = isOn ? "#c96b4a" : "var(--h3d-line)";
    });
    if (ui.insideBtn) ui.insideBtn.textContent = st.inside ? "back out" : "step inside";
  }
  function overview() {
    st.focus = null; st.inside = false; if (st.floor !== "split") setFloor("both");
    flyTo(new THREE.Vector3(6.5, 1.9, 4.5), new THREE.Vector3(23, 10.5, 24.5));
    if (ui.chip) ui.chip.style.display = "none";
    if (ui.insideBtn) ui.insideBtn.textContent = "step inside";
    ui.roomBtns.forEach((b) => { b.style.background = "transparent"; b.style.color = "var(--h3d-ink)"; b.style.borderColor = "var(--h3d-line)"; });
  }
  function setFloor(f: string) {
    st.floor = f; st.offT = f === "split" ? 3.6 : 0;
    G.f0.visible = f !== "upper"; G.f1.visible = f !== "ground";
    for (const k in ROOMS) ROOMS[k].pick!.visible = ROOMS[k].f ? G.f1.visible : G.f0.visible;
    ui.floorBtns.forEach((b) => paint(b, b.dataset.floor === f));
  }
  function setWalls(mode: string) {
    st.walls = mode; ui.wallBtns.forEach((b) => paint(b, b.dataset.wall === mode));
    fadeWalls.forEach((w) => {
      w.visible = mode !== "low";
      if (mode === "full") { w.material.opacity = 1; w.material.transparent = false; }
      else w.material.transparent = true;
    });
  }

  /* ---------- walking ---------- */
  function walkTo(nodeKey: string) {
    if (nodeKey === st.node && !st.queue.length) return;
    if (opts.reduced) {
      // Reduced motion: no walk cycle — he is simply there.
      st.node = nodeKey; st.queue = [];
      AV.position.set(...N[nodeKey]); st.baseY = N[nodeKey][1]; setPose();
      return;
    }
    st.queue = path(st.node, nodeKey); st.from = N[st.node].slice(); st.prog = 0; st.pose = "walk";
  }
  function stepWalk(dt: number) {
    if (!st.queue.length || !st.from) return;
    const to = N[st.queue[0]], from = st.from;
    const d = Math.hypot(to[0] - from[0], to[2] - from[2]) + Math.abs(to[1] - from[1]) * 0.8;
    st.prog += (1.35 * dt) / Math.max(0.25, d);
    const p = Math.min(1, st.prog);
    st.baseY = from[1] + (to[1] - from[1]) * p;
    AV.position.set(from[0] + (to[0] - from[0]) * p, st.baseY, from[2] + (to[2] - from[2]) * p);
    const ang = Math.atan2(to[0] - from[0], to[2] - from[2]);
    let da = ang - AV.rotation.y;
    while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    AV.rotation.y += da * Math.min(1, dt * 9);
    st.phase += dt * 8.5;
    if (p >= 1) { st.node = st.queue.shift()!; st.from = N[st.node].slice(); st.prog = 0; if (!st.queue.length) setPose(); }
  }
  function setPose() {
    const k = st.node;
    st.pose = k === "deskchair" ? "sit" : k === "bedside" && (st.t > 23 || st.t < 7.3) ? "lie" : "idle";
  }
  function applyPose() {
    const b = body;
    if (st.pose === "walk") {
      const s = Math.sin(st.phase), c = Math.sin(st.phase + Math.PI);
      legL.rotation.x = s * 0.55; legR.rotation.x = c * 0.55; armL.rotation.x = c * 0.42; armR.rotation.x = s * 0.42;
      b.position.y = Math.abs(Math.sin(st.phase)) * 0.035; b.rotation.x = 0; b.rotation.z = 0; AV.rotation.x = 0;
    } else if (st.pose === "sit") {
      legL.rotation.x = legR.rotation.x = -1.45; armL.rotation.x = armR.rotation.x = -0.85;
      b.position.y = -0.4; AV.rotation.x = 0; AV.rotation.y = Math.PI; b.rotation.z = 0;
    } else if (st.pose === "lie") {
      legL.rotation.x = legR.rotation.x = 0; armL.rotation.x = armR.rotation.x = -0.08;
      AV.rotation.x = -Math.PI / 2; AV.rotation.y = 0; b.position.y = 0;
    } else {
      const br = Math.sin(performance.now() / 900) * 0.02;
      legL.rotation.x = legR.rotation.x = 0; armL.rotation.x = armR.rotation.x = 0.06 + br; b.position.y = br * 0.5; AV.rotation.x = 0;
    }
    if (st.pose === "lie") { AV.position.set(1.75, 0, 1.5); st.baseY = F2 + 0.68; }
    else if (st.pose === "sit") { AV.position.set(7.05, 0, 2.35); st.baseY = F2 + 0.04; }
    const up = st.baseY > 1.4;
    AV.position.y = st.baseY + (up ? st.off : 0);
    AV.visible = st.floor === "both" || st.floor === "split" || (st.floor === "upper") === up;
  }

  /* ---------- day / night ---------- */
  const skyKeys: [number, number][] = [[0, 0x0e1524], [5, 0x2d3a55], [6.6, 0xe0a184], [8.5, 0xbcd7ee], [12, 0xcfe2f2], [16.5, 0xc9dcee], [18.3, 0xe8a06a], [19.8, 0x4a4f72], [21.5, 0x141c2e], [24, 0x0e1524]];
  const lerpKey = (h: number) => {
    for (let i = 0; i < skyKeys.length - 1; i++) if (h >= skyKeys[i][0] && h <= skyKeys[i + 1][0]) {
      const t = (h - skyKeys[i][0]) / (skyKeys[i + 1][0] - skyKeys[i][0]);
      return new THREE.Color(skyKeys[i][1]).lerp(new THREE.Color(skyKeys[i + 1][1]), t);
    }
    return new THREE.Color(skyKeys[0][1]);
  };
  let lastDay: boolean | null = null;
  function applyTime() {
    const h = st.t, day = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI));
    const sky = lerpKey(h); S.background = sky; (S.fog as THREE.Fog).color = sky;
    const a = ((h - 6) / 12) * Math.PI;
    sun.position.set(6.5 + Math.cos(a) * 26, Math.max(-6, Math.sin(a) * 24) + 2, 4.5 + 9 + Math.cos(a + 1.1) * 8);
    sun.intensity = 1.7 * day + 0.05; sun.color.setHex(day > 0.35 ? 0xfff2d8 : 0xffbf8a);
    hemi.intensity = 0.28 + day * 0.7; hemi.color.copy(sky); amb.intensity = 0.14 + day * 0.12;
    const night = 1 - Math.min(1, day * 2.4);
    M.glass.emissive.setHex(0xffca7a); M.glass.emissiveIntensity = night * 0.55;
    M.lamp.emissiveIntensity = 0.1 + night * 0.95;
    M.screen.emissiveIntensity = 0.75 + night * 0.55; M.scrA.emissiveIntensity = M.scrB.emissiveIntensity = 0.6 + night * 0.5;
    rackGlow.intensity = 0.2 + night * 0.9;
    if (st.focus) {
      const fr = ROOMS[st.focus];
      focusLamp.position.set((fr.x[0] + fr.x[1]) / 2, (fr.f ? F2 + st.off : 0) + 2.35, (fr.z[0] + fr.z[1]) / 2);
      focusLamp.intensity = 1.7 + night * 4.4;
    } else focusLamp.intensity = 0;
    const s = slotAt(h), r = ROOMS[s[1]];
    roomLamp.intensity = night * 3.2;
    roomLamp.position.set((r.x[0] + r.x[1]) / 2, (r.f ? F2 : 0) + 2.2, (r.z[0] + r.z[1]) / 2);
    const isDay = h >= 7 && h < 19;
    if (isDay !== lastDay) { lastDay = isDay; opts.onDayNight?.(isDay); }
    return s;
  }

  /* ---------- wire the dock ---------- */
  SCHED.forEach((e) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "h3d-schedrow";
    row.innerHTML = `<span>${String(Math.floor(e[0])).padStart(2, "0")}:${String(Math.round((e[0] % 1) * 60)).padStart(2, "0")}</span><span>${e[2]}</span>`;
    row.onclick = () => { st.t = e[0] + 0.05; if (ui.slider) ui.slider.value = String(st.t); focusRoom(e[1]); };
    ui.sched?.appendChild(row);
  });
  ui.wallBtns.forEach((b) => (b.onclick = () => setWalls(b.dataset.wall!)));
  ui.floorBtns.forEach((b) => (b.onclick = () => setFloor(b.dataset.floor!)));
  ui.roomBtns.forEach((b) => (b.onclick = () => focusRoom(b.dataset.room!, false)));
  const resetBtn = q<HTMLButtonElement>("reset");
  if (resetBtn) resetBtn.onclick = overview;
  if (ui.insideBtn) ui.insideBtn.onclick = () => { if (st.focus) focusRoom(st.focus, !st.inside); };
  const walkBtn = q<HTMLButtonElement>("walkBtn");
  if (walkBtn) walkBtn.onclick = () => { if (st.focus) walkTo(ROOMS[st.focus].node); };
  if (ui.play) ui.play.onclick = () => { st.run = !st.run; ui.play!.textContent = st.run ? "❙❙ pause time" : "▶ play time"; };
  if (ui.slider) ui.slider.oninput = () => { st.t = +ui.slider!.value; st.run = false; if (ui.play) ui.play.textContent = "▶ play time"; };
  const closeChip = q<HTMLButtonElement>("closeChip");
  if (closeChip) closeChip.onclick = overview;
  const onKey = (e: Event) => { if ((e as KeyboardEvent).key === "Escape") overview(); };
  on(window, "keydown", onKey);

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let downAt: { x: number; y: number; t: number } | null = null;
  const onDown = (e: Event) => { const pe = e as PointerEvent; downAt = { x: pe.clientX, y: pe.clientY, t: performance.now() }; };
  const onUp = (e: Event) => {
    const pe = e as PointerEvent;
    if (!downAt || performance.now() - downAt.t > 420 || Math.hypot(pe.clientX - downAt.x, pe.clientY - downAt.y) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((pe.clientX - r.left) / r.width) * 2 - 1, -((pe.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(G.pick.children.filter((o) => o.visible), false)[0];
    if (hit) { const k = hit.object.userData.room as string; focusRoom(k, st.focus === k ? !st.inside : false); }
  };
  on(renderer.domElement, "pointerdown", onDown);
  on(renderer.domElement, "pointerup", onUp);

  /* ---------- loop ---------- */
  let last = performance.now(), lastSlot: Slot | null = null, raf = 0, disposed = false;
  const schedRows = () => [...(ui.sched?.children ?? [])] as HTMLElement[];
  function frame(now: number) {
    if (disposed) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (st.run) { st.t = (st.t + st.speed * dt) % 24; if (ui.slider && document.activeElement !== ui.slider) ui.slider.value = String(st.t); }
    st.off += (st.offT - st.off) * Math.min(1, dt * 5);
    G.f1.position.y = st.off;
    for (const k in ROOMS) { const r = ROOMS[k]; r.pick!.position.y = r.pick!.userData.y0 + (r.f ? st.off : 0); }
    const slot = applyTime();
    if (slot !== lastSlot) { lastSlot = slot; walkTo(slot[3]); }
    const hh = Math.floor(st.t), mm = Math.floor((st.t % 1) * 60);
    if (ui.clock) ui.clock.textContent = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    if (ui.nowRoom) ui.nowRoom.textContent = ROOMS[slot[1]].n.toUpperCase();
    if (ui.nowAct) ui.nowAct.textContent = slot[2];
    schedRows().forEach((row, i) => row.classList.toggle("is-now", SCHED[i] === slot));

    stepWalk(dt); applyPose();

    if (tween) {
      tween.k = Math.min(1, tween.k + dt / tween.dur); const e = ease(tween.k);
      controls.target.lerpVectors(tween.ft, tween.tt, e); camera.position.lerpVectors(tween.fp, tween.tp, e);
      if (tween.k >= 1) tween = null;
    }
    if (st.walls === "cutaway") {
      for (const w of fadeWalls) {
        const d = camera.position.clone().sub(w.userData.c as THREE.Vector3).normalize().dot(w.userData.n as THREE.Vector3);
        const want = d > 0.12 ? 0.07 : 1;
        w.material.opacity += (want - w.material.opacity) * Math.min(1, dt * 7);
        w.material.transparent = w.material.opacity < 0.99;
        w.material.depthWrite = w.material.opacity > 0.5;
      }
    }
    controls.target.x = Math.max(-4, Math.min(XW + 4, controls.target.x));
    controls.target.z = Math.max(-4, Math.min(ZD + 4, controls.target.z));
    controls.target.y = Math.max(0, Math.min(6.4, controls.target.y));
    controls.update();
    renderer.render(S, camera);
    raf = requestAnimationFrame(frame);
  }
  AV.position.set(...N.deskchair);
  setWalls("cutaway"); setFloor("both");
  // Land the avatar where the schedule says he is right now.
  const startSlot = slotAt(st.t);
  st.node = startSlot[3]; AV.position.set(...N[st.node]); st.baseY = N[st.node][1]; setPose();
  raf = requestAnimationFrame(frame);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      disposers.forEach((d) => d());
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      S.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => m?.dispose());
        }
      });
    },
  };
}
