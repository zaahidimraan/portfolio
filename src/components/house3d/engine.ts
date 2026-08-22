/**
 * The 3D house engine, v2 (E50) — a faithful port of Zahid's canonical
 * `house3d.js` from his Claude Design project, per his SYNC.md handoff.
 *
 * One-storey bungalow, 18 × 11 m: two rows of rooms around a full-width
 * corridor, deck on the east. WALLS render as 16 cm floor lines by default
 * (`line`), with `low`, `cutaway` (camera-facing walls hide) and `full`;
 * glazing and doors auto-hide in line/low. A LIGHT control (soft/studio/
 * bright) plus a camera-following fill keep interiors readable at any
 * angle. Screens face into their rooms. Every mapped room names the site
 * section it stands for (SYNC.md's section→room table) and its `sec` key
 * matches the site's anchor ids, which the chip's "open section" link uses.
 *
 * Portfolio adaptations (same contract as v1): scoped [data-h3d] DOM, real
 * start hour, day/night callback for the page theme, reduced-motion
 * teleporting, dispose() for strict-mode remounts.
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type House3DOptions = {
  startHour: number;
  reduced: boolean;
  onDayNight?: (day: boolean) => void;
};

export type House3DHandle = { dispose: () => void };

/* ---------- constants (metres, y-up) — single-storey bungalow 18 x 11 ---------- */
const TI = 0.12, TE = 0.2, H = 2.7, CUT = 1.0, F2 = 2.9; // F2 kept: some furniture was authored one floor up
const XW = 18, ZD = 11;

const BASE: Record<string, number> = {
  plaster: 0xf1e5cf, plaster2: 0xe4d7bc, wood: 0xc9a06a, wood2: 0xb98c5a, tile: 0xdcd4c4,
  walnut: 0xa5713f, terra: 0xc96b4a, sage: 0x7fae6a, must: 0xe7c14e, teal: 0x7fa9a3, slate: 0x37404e,
  char: 0x2b303a, white: 0xf7f2e6, steel: 0x9aa3ad, skin: 0xd9a077, hair: 0x54392a, shirt: 0xa3403a,
  jeans: 0x3f7fb5, grass: 0x93ad68, hedge: 0x6f9455, trunk: 0x7a5c38, screen: 0x1c2431, rugA: 0xc0503f,
  rugB: 0x7fa9a3, ceramic: 0xf2ede1,
};
const BOOKS = [0xc95f4f, 0x5f8f7a, 0xe7c14e, 0x7fa9a3, 0xb56a9f, 0x5b7fb5];
const PALETTES: Record<string, Record<string, number>> = {
  clay: {},
  nord: { plaster: 0xeff2f3, plaster2: 0xe0e5e7, wood: 0xcbae88, wood2: 0xbb9a72, terra: 0x8fa9b8, sage: 0x9ab5a3,
    must: 0xe3c98f, teal: 0x7f9bab, rugA: 0x8a9fb0, rugB: 0xa9bcc4, walnut: 0xa08464, grass: 0x9db878, hedge: 0x7c9c6b },
  dusk: { plaster: 0xe9dad2, plaster2: 0xd8c6bd, wood: 0xb98a63, wood2: 0xa87a56, terra: 0xa5514b, sage: 0x7d8f74,
    must: 0xd9a35a, teal: 0x6f7f92, rugA: 0x8d4a44, rugB: 0x6f8a90, walnut: 0x8f6242, grass: 0x86a066, hedge: 0x63875a },
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
  S.fog = new THREE.Fog(0xcfe2f2, 80, 170);

  const M: Record<string, THREE.MeshStandardMaterial> = {};
  const mk = (n: string, col: number, o: Record<string, unknown> = {}) =>
    (M[n] = Object.assign(new THREE.MeshStandardMaterial({ color: col, roughness: 0.88, metalness: 0, ...o }), { name: n }));
  for (const k in BASE) mk(k, BASE[k]);
  mk("steel", BASE.steel, { roughness: 0.35, metalness: 0.55 });
  mk("glass", 0xbcd8de, { transparent: true, opacity: 0.26, roughness: 0.08, metalness: 0.1, emissive: 0x000000 });
  mk("screen", BASE.screen, { roughness: 0.3, emissive: 0x3a6fa8, emissiveIntensity: 0.9 });
  mk("scrA", 0x58d08a, { emissive: 0x58d08a, emissiveIntensity: 0.8, roughness: 0.4 });
  mk("scrB", 0x6fa2d8, { emissive: 0x6fa2d8, emissiveIntensity: 0.8, roughness: 0.4 });
  mk("lamp", 0xffe6b0, { emissive: 0xffca70, emissiveIntensity: 0.2, roughness: 0.6 });
  mk("ledG", 0x58d08a, { emissive: 0x58d08a, emissiveIntensity: 1, roughness: 0.5 });
  mk("ledY", 0xf2c14e, { emissive: 0xf2c14e, emissiveIntensity: 1, roughness: 0.5 });
  mk("ledO", 0x2a323c);
  BOOKS.forEach((b, i) => mk("book" + i, b));
  const pickMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  function applyPalette(name: string) {
    const p = PALETTES[name] || {};
    for (const k in BASE) if (M[k]) M[k].color.setHex(k in p ? p[k] : BASE[k]);
  }

  /* ---------- helpers ---------- */
  const G = { env: new THREE.Group(), house: new THREE.Group(), pick: new THREE.Group() };
  Object.values(G).forEach((g) => S.add(g));

  function bx(x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, m: THREE.Material, g?: THREE.Object3D, name?: string) {
    const me = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0) || 0.01, Math.abs(y1 - y0) || 0.01, Math.abs(z1 - z0) || 0.01), m);
    me.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    me.castShadow = me.receiveShadow = true; me.name = name || "part";
    (g || S).add(me); return me;
  }
  function cyl(x: number, z: number, y0: number, y1: number, r: number, m: THREE.Material, g?: THREE.Object3D, segN = 18, name?: string) {
    const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.abs(y1 - y0), segN), m);
    me.position.set(x, (y0 + y1) / 2, z); me.castShadow = me.receiveShadow = true; me.name = name || "cyl";
    (g || S).add(me); return me;
  }

  /* ---------- walls: removable / line-able per segment ---------- */
  type WallSeg = { mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>; n: THREE.Vector3; c: THREE.Vector3; upper: boolean; y0: number; h: number };
  const walls: WallSeg[] = [];
  const trims: THREE.Mesh[] = []; // glazing + doors, hidden when walls are lines
  function seg(ax: "x" | "z", fx: number, a0: number, a1: number, y0: number, y1: number, t: number, g: THREE.Object3D, n: { nx: number; nz: number }, upper: boolean) {
    const m = M.plaster.clone(); m.name = "wall";
    const me = (ax === "x" ? bx(a0, fx - t / 2, a1, fx + t / 2, y0, y1, m, g, "wall")
      : bx(fx - t / 2, a0, fx + t / 2, a1, y0, y1, m, g, "wall")) as WallSeg["mesh"];
    walls.push({ mesh: me, n: new THREE.Vector3(n.nx, 0, n.nz), c: me.position.clone(), upper, y0, h: Math.abs(y1 - y0) });
    return me;
  }
  type Op = [number, number, "w" | "d"];
  function wallRun(ax: "x" | "z", fx: number, a0: number, a1: number, nx: number, nz: number, t: number, ops: Op[] = [], g?: THREE.Object3D) {
    const gg = g || S;
    const y0 = 0, y1 = H, list = ops.slice().sort((p, qq) => p[0] - qq[0]); let c = a0;
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
      const cut = Math.min(Math.max(CUT, b), tp);
      if (cut > b + 0.02) seg(ax, fx, s, e, b, cut, t, gg, { nx, nz }, false);
      if (tp > cut + 0.02) seg(ax, fx, s, e, cut, tp, t, gg, { nx, nz }, true);
    }
    for (const [s, e, k] of list) {
      if (k !== "w") continue;
      const gy0 = 0.97, gy1 = 2.1, fr = 0.06;
      if (ax === "x") {
        trims.push(
          bx(s, fx - 0.02, e, fx + 0.02, gy0, gy1, M.glass, gg, "pane"),
          bx(s, fx - t / 2, s + fr, fx + t / 2, gy0, gy1, M.white, gg, "frame"),
          bx(e - fr, fx - t / 2, e, fx + t / 2, gy0, gy1, M.white, gg, "frame"),
          bx(s, fx - t / 2, e, fx + t / 2, gy0 - 0.05, gy0, M.white, gg, "sill"),
        );
      } else {
        trims.push(
          bx(fx - 0.02, s, fx + 0.02, e, gy0, gy1, M.glass, gg, "pane"),
          bx(fx - t / 2, s, fx + t / 2, s + fr, gy0, gy1, M.white, gg, "frame"),
          bx(fx - t / 2, e - fr, fx + t / 2, e, gy0, gy1, M.white, gg, "frame"),
          bx(fx - t / 2, s, fx + t / 2, e, gy0 - 0.05, gy0, M.white, gg, "sill"),
        );
      }
    }
  }

  /* ---------- plot ---------- */
  (function plot() {
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(170, 150), M.grass);
    gp.rotation.x = -Math.PI / 2; gp.position.set(9, -0.16, 5.5); gp.receiveShadow = true; G.env.add(gp);
    bx(-0.35, -0.35, XW + 0.35, ZD + 0.35, -0.16, 0, M.plaster2, G.env, "foundation");
    bx(-6.2, 4.85, 0, 6.05, -0.14, -0.04, M.wood2, G.env, "path");
    bx(1.0, ZD + 0.35, 3.4, ZD + 5.4, -0.14, -0.04, M.plaster2, G.env, "driveway");
    bx(-3.4, -2.4, XW + 3.4, -1.9, -0.15, 0.55, M.hedge, G.env, "hedge");
    bx(-3.4, -2.4, -2.9, ZD + 5.6, -0.15, 0.55, M.hedge, G.env, "hedge");
    bx(XW + 2.9, -2.4, XW + 3.4, ZD + 5.6, -0.15, 0.55, M.hedge, G.env, "hedge");
    const tree = (x: number, z: number, s: number) => {
      cyl(x, z, -0.1, 1.1 * s, 0.16 * s, M.trunk, G.env, 10, "trunk");
      const f1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95 * s, 0), M.hedge); f1.position.set(x, 1.65 * s, z); f1.castShadow = true; G.env.add(f1);
      const f2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62 * s, 0), M.sage); f2.position.set(x + 0.35 * s, 2.35 * s, z - 0.2 * s); f2.castShadow = true; G.env.add(f2);
    };
    tree(-4.6, 1.6, 1.25); tree(-4.0, 9.8, 0.95); tree(6.0, -4.2, 1.1); tree(XW + 4.6, 3.0, 1.3); tree(XW + 3.8, 12.4, 1.15);
  })();

  /* ---------- room table: bounds + section map (SYNC.md) ---------- */
  type Room = {
    n: string; x: [number, number]; z: [number, number];
    src?: [number, number, number]; rot?: boolean;
    act: string; sec: string | null; pick?: THREE.Mesh;
  };
  const ROOMS: Record<string, Room> = {
    kitchen: { n: "Kitchen", x: [0, 4.4], z: [0, 4.6], src: [-0.15, 0, 0], act: "01 · impact in numbers — 85% agreement, 40% fewer false positives", sec: "impact" },
    drawing: { n: "Drawing room", x: [4.4, 9.6], z: [0, 4.6], src: [-0.2, 0, 0], act: "03 · projects — the three flagships and everything else", sec: "projects" },
    bedroom: { n: "Bedroom", x: [9.6, 14.0], z: [0, 4.6], src: [9.5, -F2, 0], act: "asleep", sec: null },
    bath: { n: "Bathroom", x: [14.0, 18], z: [0, 4.6], src: [18, -F2, 9.0], rot: true, act: "getting ready", sec: null },
    hall: { n: "Corridor", x: [0, 18], z: [4.6, 6.3], act: "04 · experience — POWWR, Sparkix, Horizon, GrayHat", sec: "experience" },
    garage: { n: "Garage / workshop", x: [0, 4.4], z: [6.3, 11], src: [-0.1, 0, 2.0], act: "05 · skills — agentic orchestration, GenAI, eval & ops", sec: "skills" },
    library: { n: "Library", x: [4.4, 8.6], z: [6.3, 11], src: [17.8, 0, 11], rot: true, act: "06 · certificates — 15 across three tracks", sec: "certificates" },
    office: { n: "Office", x: [8.6, 13.4], z: [6.3, 11], src: [18, -F2, 11], rot: true, act: "02 · document-AI pipelines and agentic tooling", sec: "office" },
    server: { n: "Server room", x: [13.4, 18], z: [6.3, 11], src: [27.2, -F2, 11], rot: true, act: "07 · ask my portfolio — the live MCP server", sec: "mcp" },
    balcony: { n: "Balcony / garden", x: [18, 21.6], z: [2.0, 9.5], act: "08 · contact — open to AI engineering roles", sec: "contact" },
  };

  /* ---------- floors ---------- */
  const fl = (r: Room, m: THREE.Material) => bx(r.x[0], r.z[0], r.x[1], r.z[1], -0.04, 0, m, G.house, "floor");
  fl(ROOMS.kitchen, M.tile); fl(ROOMS.drawing, M.wood); fl(ROOMS.bedroom, M.wood); fl(ROOMS.bath, M.tile);
  fl(ROOMS.hall, M.wood); fl(ROOMS.garage, M.plaster2); fl(ROOMS.library, M.wood); fl(ROOMS.office, M.wood); fl(ROOMS.server, M.plaster2);

  /* ---------- walls ---------- */
  wallRun("x", 0, 0, XW, 0, -1, TE, [[1.0, 2.6, "w"], [5.6, 7.6, "w"], [10.4, 12.4, "w"], [15.6, 17.0, "w"]], G.house);
  wallRun("x", ZD, 0, XW, 0, 1, TE, [[1.0, 3.4, "d"], [5.4, 7.4, "w"], [9.6, 12.4, "w"]], G.house);
  wallRun("z", 0, 0, ZD, -1, 0, TE, [[1.2, 3.0, "w"], [4.7, 6.2, "d"], [7.6, 9.6, "w"]], G.house);
  wallRun("z", XW, 0, ZD, 1, 0, TE, [[1.0, 2.6, "w"], [4.7, 6.2, "d"]], G.house);
  wallRun("x", 4.6, 0, XW, 0, 1, TI, [[2.2, 3.4, "d"], [6.2, 8.0, "d"], [11.6, 12.8, "d"], [15.4, 16.6, "d"]], G.house);
  wallRun("x", 6.3, 0, XW, 0, -1, TI, [[2.2, 3.4, "d"], [5.6, 6.8, "d"], [10.4, 11.8, "d"], [15.2, 16.4, "d"]], G.house);
  wallRun("z", 4.4, 0, 4.6, 1, 0, TI, [[1.6, 2.8, "d"]], G.house);
  wallRun("z", 9.6, 0, 4.6, 1, 0, TI, [], G.house);
  wallRun("z", 14.0, 0, 4.6, 1, 0, TI, [[1.4, 2.6, "d"]], G.house);
  wallRun("z", 4.4, 6.3, ZD, 1, 0, TI, [], G.house);
  wallRun("z", 8.6, 6.3, ZD, 1, 0, TI, [[7.4, 8.8, "d"]], G.house);
  wallRun("z", 13.4, 6.3, ZD, 1, 0, TI, [[7.0, 9.4, "d"]], G.house);
  trims.push(
    bx(-0.06, 4.75, 0.06, 6.15, 0.02, 2.05, M.terra, G.house, "frontDoor"),
    bx(-0.12, 5.95, -0.02, 6.06, 0.95, 1.12, M.steel, G.house, "handle"),
    bx(17.94, 4.78, 18.06, 6.12, 0.05, 2.04, M.glass, G.house, "patioGlass"),
    bx(17.9, 4.7, 18.1, 4.8, 0.05, 2.06, M.walnut, G.house, "patioFrame"),
    bx(17.9, 6.1, 18.1, 6.2, 0.05, 2.06, M.walnut, G.house, "patioFrame"),
  );

  /* ---------- furniture (authored in local blocks, dropped into rooms) ---------- */
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
  function drawing(g: THREE.Object3D) {
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
  function bedroom(g: THREE.Object3D) {
    const y = F2 + 0.04;
    bx(0.5, 0.5, 3.0, 2.55, y, y + 0.38, M.walnut, g, "bedFrame");
    bx(0.55, 0.55, 2.95, 2.5, y + 0.38, y + 0.62, M.white, g, "mattress");
    bx(0.5, 0.45, 3.0, 0.58, y, y + 1.0, M.walnut, g, "headboard");
    bx(0.6, 0.62, 1.65, 1.05, y + 0.62, y + 0.76, M.white, g, "pillow"); bx(1.85, 0.62, 2.9, 1.05, y + 0.62, y + 0.76, M.white, g, "pillow");
    bx(0.55, 1.15, 2.95, 2.5, y + 0.62, y + 0.74, M.terra, g, "duvet");
    bx(3.25, 0.5, 3.95, 1.2, y, y + 0.5, M.walnut, g, "nightstand");
    cyl(3.6, 0.85, y + 0.5, y + 0.78, 0.03, M.steel, g, 10, "lampStem"); cyl(3.6, 0.85, y + 0.78, y + 0.98, 0.15, M.lamp, g, 14, "lampShade");
    bx(3.3, 2.6, 4.3, 4.25, y, y + 2.1, M.plaster, g, "wardrobe");
    bx(3.78, 2.55, 3.84, 4.2, y, y + 2.1, M.walnut, g, "wardrobeSplit");
    bx(0.6, 2.8, 2.9, 4.2, y, y + 0.02, M.rugB, g, "rug");
    bx(0.5, 3.4, 1.3, 4.2, y, y + 0.45, M.sage, g, "plantPot");
  }
  function office(g: THREE.Object3D) {
    const y = F2 + 0.04, dz0 = 0.28, dz1 = 1.0, dy = y + 0.74;
    bx(4.95, dz0, 8.9, dz1, dy - 0.05, dy, M.walnut, g, "deskTop");
    [5.1, 8.6].forEach((x) => bx(x - 0.05, dz0 + 0.05, x + 0.05, dz1 - 0.05, y, dy - 0.05, M.slate, g, "deskLeg"));
    bx(4.95, dz0, 8.9, dz0 + 0.06, y + 0.3, dy - 0.06, M.slate, g, "deskPanel");
    const mon = (xc: number, w: number, h: number, tilt: THREE.Material) => {
      bx(xc - 0.09, dz0 + 0.16, xc + 0.09, dz0 + 0.28, dy, dy + 0.05, M.char, g, "monFoot");
      bx(xc - 0.03, dz0 + 0.2, xc + 0.03, dz0 + 0.24, dy + 0.05, dy + 0.3, M.char, g, "monStem");
      bx(xc - w / 2, dz0 + 0.16, xc + w / 2, dz0 + 0.21, dy + 0.3, dy + 0.3 + h, M.char, g, "monBack");
      // screens face INTO the room (SYNC.md #4)
      bx(xc - w / 2 + 0.03, dz0 + 0.21, xc + w / 2 - 0.03, dz0 + 0.25, dy + 0.33, dy + 0.27 + h, tilt, g, "monScreen");
    };
    mon(5.75, 1.0, 0.58, M.screen); mon(6.95, 1.22, 0.68, M.screen); mon(8.15, 0.62, 0.82, M.scrA);
    for (let i = 0; i < 6; i++) bx(6.45 + (i % 2) * 0.3, dz0 + 0.25, 6.45 + (i % 2) * 0.3 + 0.22, dz0 + 0.255, dy + 0.5 + i * 0.07, dy + 0.53 + i * 0.07, i % 2 ? M.scrB : M.scrA, g, "codeLine");
    bx(6.5, 1.15, 7.6, 1.45, dy, dy + 0.03, M.char, g, "keyboard");
    for (let i = 0; i < 10; i++) bx(6.55 + i * 0.105, 1.19, 6.55 + i * 0.105 + 0.08, 1.41, dy + 0.03, dy + 0.036, M.slate, g, "keys");
    bx(7.8, 1.2, 7.98, 1.42, dy, dy + 0.035, M.slate, g, "mouse");
    cyl(5.45, 1.25, dy, dy + 0.11, 0.045, M.terra, g, 12, "mug");
    bx(8.35, 1.1, 8.8, 1.55, dy, dy + 0.28, M.wood, g, "notebook");
    const cx = 7.05, cz = 1.95;
    cyl(cx, cz, y, y + 0.04, 0.32, M.char, g, 16, "chairBase");
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const cst = bx(cx - 0.04, cz - 0.04, cx + 0.04, cz + 0.04, y, y + 0.05, M.char, g, "caster");
      cst.position.set(cx + Math.cos(a) * 0.28, y + 0.03, cz + Math.sin(a) * 0.28);
    }
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
    // CRT screen faces into the room (SYNC.md #4)
    bx(11.85, 2.25, 12.65, 2.31, y + 0.8, y + 1.1, M.scrA, g, "crtScreen");
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
    bx(0.35, 7.98, 1.45, 8.02, y + 1.1, y + 1.9, M.glass, g, "mirror");
    bx(2.6, 7.9, 3.2, 8.6, y, y + 0.42, M.ceramic, g, "toilet"); bx(2.6, 8.5, 3.2, 8.66, y + 0.42, y + 0.82, M.ceramic, g, "cistern");
    bx(2.0, 5.0, 2.06, 6.0, y + 1.35, y + 1.42, M.steel, g, "towelRail");
    bx(1.86, 5.1, 2.04, 5.5, y + 0.95, y + 1.4, M.teal, g, "towel"); bx(1.86, 5.6, 2.04, 5.95, y + 1.0, y + 1.4, M.terra, g, "towel");
    bx(1.9, 6.9, 3.0, 7.8, y, y + 0.02, M.rugB, g, "mat");
    bx(3.5, 4.8, 4.1, 5.4, y, y + 0.5, M.hedge, g, "plantPot");
  }
  function corridor(g: THREE.Object3D) {
    bx(0.6, 5.55, 16.8, 6.1, 0.001, 0.02, M.rugA, g, "runner");
    bx(1.1, 4.75, 2.0, 5.15, 0.05, 0.78, M.walnut, g, "console"); bx(1.05, 4.7, 2.05, 5.2, 0.78, 0.84, M.wood, g, "consoleTop");
    bx(1.35, 4.82, 1.75, 5.06, 0.84, 0.96, M.sage, g, "bowl");
    bx(0.45, 4.72, 1.0, 4.78, 1.72, 1.8, M.walnut, g, "coatRail");
    bx(0.5, 4.7, 0.78, 4.98, 1.15, 1.7, M.terra, g, "coat"); bx(0.85, 4.7, 1.1, 4.94, 1.25, 1.68, M.slate, g, "coat");
    bx(3.9, 4.72, 5.3, 4.8, 1.5, 2.1, M.plaster2, g, "artFrame");
    bx(8.6, 4.72, 9.9, 4.8, 1.55, 2.05, M.plaster2, g, "artFrame");
    bx(13.1, 4.72, 14.2, 4.8, 1.5, 2.1, M.plaster2, g, "artFrame");
    bx(16.9, 5.5, 17.5, 6.1, 0, 0.5, M.hedge, g, "plantPot");
    cyl(6.6, 5.45, 2.42, 2.62, 0.16, M.lamp, g, 14, "pendant"); cyl(11.6, 5.45, 2.42, 2.62, 0.16, M.lamp, g, 14, "pendant");
  }
  function balcony(g: THREE.Object3D) {
    for (let i = 0; i < 18; i++) bx(18.05, 2.05 + i * 0.41, 21.55, 2.39 + i * 0.41, -0.04, 0.02, M.wood2, g, "deckPlank");
    const post = (x: number, z: number) => cyl(x, z, 0.02, 0.92, 0.028, M.steel, g, 8, "baluster");
    for (let i = 0; i <= 9; i++) post(21.5, 2.1 + (9.4 - 2.1) * i / 9);
    for (let i = 0; i <= 4; i++) { post(18.2 + (21.5 - 18.2) * i / 4, 2.1); post(18.2 + (21.5 - 18.2) * i / 4, 9.4); }
    bx(21.44, 2.05, 21.56, 9.45, 0.92, 0.99, M.walnut, g, "rail");
    bx(18.1, 2.02, 21.56, 2.14, 0.92, 0.99, M.walnut, g, "rail"); bx(18.1, 9.36, 21.56, 9.48, 0.92, 0.99, M.walnut, g, "rail");
    bx(18.5, 6.6, 20.4, 8.5, 0.06, 0.3, M.wood2, g, "lounger"); bx(18.5, 8.1, 20.4, 8.5, 0.3, 0.95, M.wood2, g, "loungerBack");
    bx(18.6, 6.7, 20.3, 8.2, 0.3, 0.38, M.must, g, "cushion");
    bx(20.7, 7.0, 21.3, 7.6, 0.06, 0.45, M.walnut, g, "sideTable");
    cyl(21.0, 7.3, 0.45, 0.58, 0.06, M.ceramic, g, 12, "cup");
    ([[18.4, 2.4], [19.5, 2.4], [20.6, 2.4]] as const).forEach(([x, z], i) => {
      bx(x, z, x + 0.8, z + 0.8, 0.02, 0.5, M.terra, g, "planter");
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 + i * 0.05, 0), i === 1 ? M.hedge : M.sage);
      f.position.set(x + 0.4, 0.85, z + 0.4); f.castShadow = true; g.add(f);
    });
    bx(18.6, 4.5, 20.2, 5.9, 0.001, 0.02, M.rugB, g, "outdoorRug");
    bx(19.0, 4.7, 19.9, 5.7, 0.05, 0.42, M.walnut, g, "lowTable");
    for (let i = 0; i < 8; i++) { const t = i / 7, y = 2.5 - Math.sin(t * Math.PI) * 0.34; cyl(18.2 + t * 3.2, 9.3, y, y + 0.1, 0.045, M.lamp, g, 8, "bulb"); }
  }
  const FURN: Record<string, (g: THREE.Object3D) => void> = { kitchen, drawing, library, garage, bedroom, office, server, bath };
  for (const k in ROOMS) {
    const r = ROOMS[k]; if (!FURN[k] || !r.src) continue;
    const grp = new THREE.Group(); grp.name = k; G.house.add(grp);
    if (r.rot) grp.rotation.y = Math.PI;
    grp.position.set(r.src[0], r.src[1], r.src[2]);
    FURN[k](grp);
  }
  corridor(G.house); balcony(G.house);

  /* ---------- pickers ---------- */
  for (const k in ROOMS) {
    const r = ROOMS[k];
    const p = bx(r.x[0] + 0.05, r.z[0] + 0.05, r.x[1] - 0.05, r.z[1] - 0.05, 0.02, 2.3, pickMat, G.pick, "pick_" + k);
    p.castShadow = p.receiveShadow = false; p.userData.room = k; r.pick = p;
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

  /* ---------- waypoint graph (all on one floor) ---------- */
  const N: Record<string, [number, number, number]> = {
    front: [-1.1, 0, 5.45], cW: [1.4, 0, 5.45], c1: [2.8, 0, 5.45], c2: [7.1, 0, 5.45], c3: [11.6, 0, 5.45], c4: [15.8, 0, 5.45], cE: [17.4, 0, 5.45],
    kdoor: [2.8, 0, 4.6], kitchen: [2.2, 0, 2.4],
    ddoor: [7.1, 0, 4.6], drawing: [7.0, 0, 2.5],
    bdoor: [12.2, 0, 4.6], bedroom: [11.9, 0, 3.2], bedside: [12.6, 0, 1.7],
    ens: [14.0, 0, 2.0], bathdoor: [15.9, 0, 4.6], bath: [16.0, 0, 2.6],
    gdoor: [2.8, 0, 6.3], garage: [2.2, 0, 8.4],
    libdoor: [6.2, 0, 6.3], library: [6.4, 0, 8.4],
    odoor: [11.1, 0, 6.3], office: [10.6, 0, 8.2], deskchair: [11.05, 0, 9.05],
    sdoor: [15.8, 0, 6.3], server: [15.6, 0, 8.4], os: [13.4, 0, 8.2],
    patio: [18.0, 0, 5.45], balcony: [19.6, 0, 6.4],
  };
  const E: [string, string][] = [["front", "cW"], ["cW", "c1"], ["c1", "c2"], ["c2", "c3"], ["c3", "c4"], ["c4", "cE"],
    ["c1", "kdoor"], ["kdoor", "kitchen"], ["c2", "ddoor"], ["ddoor", "drawing"], ["c3", "bdoor"], ["bdoor", "bedroom"],
    ["bedroom", "bedside"], ["bedroom", "ens"], ["ens", "bath"], ["c4", "bathdoor"], ["bathdoor", "bath"],
    ["c1", "gdoor"], ["gdoor", "garage"], ["c2", "libdoor"], ["libdoor", "library"], ["c3", "odoor"], ["odoor", "office"],
    ["office", "deskchair"], ["office", "os"], ["os", "server"], ["c4", "sdoor"], ["sdoor", "server"],
    ["cE", "patio"], ["patio", "balcony"]];
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

  /* ---------- schedule (real work names, SYNC.md) ---------- */
  type Slot = [number, string, string, string];
  const SCHED: Slot[] = [[0, "bedroom", "asleep", "bedside"], [7.4, "bath", "getting ready", "bath"], [8.1, "kitchen", "coffee + breakfast", "kitchen"],
    [9, "office", "document-AI pipelines", "deskchair"], [13, "kitchen", "lunch", "kitchen"], [14, "office", "agentic tooling + evals", "deskchair"],
    [17, "library", "reading", "library"], [18.4, "garage", "tinkering", "garage"], [20, "kitchen", "cooking dinner", "kitchen"],
    [21, "drawing", "film + records", "drawing"], [22.6, "balcony", "night air", "balcony"], [23.2, "bedroom", "asleep", "bedside"]];
  const slotAt = (h: number) => { let s = SCHED[0]; for (const e of SCHED) if (h >= e[0]) s = e; return s; };

  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight(0xcfe2f2, 0x8a7f68, 0.85); S.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -22; sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -18; sun.shadow.camera.far = 90; sun.shadow.bias = -0.0009;
  sun.target.position.set(9, 1, 5.5); S.add(sun, sun.target);
  const amb = new THREE.AmbientLight(0xffffff, 0.3); S.add(amb);
  const fill = new THREE.DirectionalLight(0xfff4e4, 0.5); S.add(fill, fill.target); // follows the camera so interiors never go black
  const roomLamp = new THREE.PointLight(0xffc98a, 0, 8, 2); S.add(roomLamp);
  const focusLamp = new THREE.PointLight(0xffe4c0, 0, 9, 2); S.add(focusLamp);
  const rackGlow = new THREE.PointLight(0x7fb8ff, 0.5, 5, 2); rackGlow.position.set(15.6, 1.3, 9.6); S.add(rackGlow);

  /* ---------- renderer / camera / controls ---------- */
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 260);
  const HOME_T = new THREE.Vector3(10.5, 0.8, 5.8), HOME_P = new THREE.Vector3(32, 14.5, 28);
  camera.position.copy(HOME_P);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(HOME_T);
  controls.enableDamping = true; controls.dampingFactor = 0.075; controls.screenSpacePanning = true;
  controls.minDistance = 1.5; controls.maxDistance = 68; controls.minPolarAngle = 0.1; controls.maxPolarAngle = 1.45;
  controls.zoomSpeed = 0.8; controls.rotateSpeed = 0.8; controls.panSpeed = 0.8; controls.autoRotateSpeed = 0.35;
  function resize() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
  on(window, "resize", resize);
  const ro = new ResizeObserver(resize); ro.observe(host); disposers.push(() => ro.disconnect());
  resize();

  /* ---------- state ---------- */
  const st = {
    t: opts.startHour, run: !opts.reduced, dayLen: 190, walls: "line", palette: "clay", light: 1,
    focus: null as string | null, inside: false, node: "deskchair", queue: [] as string[],
    pose: "sit", from: null as number[] | null, prog: 0, phase: 0,
    showChar: true, showGarden: true, orbit: false,
  };
  AV.position.set(N.deskchair[0], 0, N.deskchair[2]);

  let tween: { k: number; dur: number; ft: THREE.Vector3; fp: THREE.Vector3; tt: THREE.Vector3; tp: THREE.Vector3 } | null = null;
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  function flyTo(tgt: THREE.Vector3, pos: THREE.Vector3, dur = 0.95) {
    tween = { k: 0, dur, ft: controls.target.clone(), fp: camera.position.clone(), tt: tgt, tp: pos };
  }

  /* ---------- UI ---------- */
  const ui = {
    clock: q("clock"), nowRoom: q("nowRoom"), nowAct: q("nowAct"), nowSec: q("nowSec"),
    slider: q<HTMLInputElement>("timeSlider"), sched: q("sched"), chip: q("chip"),
    chipName: q("chipName"), chipAct: q("chipAct"), chipSec: q<HTMLAnchorElement>("chipSec"),
    wallBtns: [...root.querySelectorAll<HTMLButtonElement>("[data-wall]")],
    palBtns: [...root.querySelectorAll<HTMLButtonElement>("[data-pal]")],
    lightBtns: [...root.querySelectorAll<HTMLButtonElement>("[data-light]")],
    roomBtns: [...root.querySelectorAll<HTMLButtonElement>("[data-room]")],
    play: q<HTMLButtonElement>("play"), insideBtn: q<HTMLButtonElement>("insideBtn"),
    dayLen: q<HTMLInputElement>("dayLen"), dayLenVal: q("dayLenVal"),
  };
  const paint = (b: HTMLButtonElement, isOn: boolean) => { b.style.background = isOn ? "#37404e" : "transparent"; b.style.color = isOn ? "#fff" : "var(--h3d-ink)"; };

  function focusRoom(k: string, inside?: boolean) {
    const r = ROOMS[k]; if (!r) return;
    st.focus = k; st.inside = !!inside;
    const cx = (r.x[0] + r.x[1]) / 2, cz = (r.z[0] + r.z[1]) / 2;
    const size = Math.max(Math.min(r.x[1] - r.x[0], 6.4), Math.min(r.z[1] - r.z[0], 6.4));
    const sx = Math.sign(cx - XW / 2) || 1, sz = Math.sign(cz - ZD / 2) || 1;
    const th = Math.atan2(sx * Math.max(Math.abs(cx - XW / 2), 2.4), sz * Math.max(Math.abs(cz - ZD / 2), 2.4));
    const tgt = new THREE.Vector3(cx, inside ? 1.15 : 0.9, cz);
    const sph = inside ? new THREE.Spherical(size * 0.55 + 2.2, 1.3, th) : new THREE.Spherical(size * 1.25 + 4.2, 0.86, th);
    flyTo(tgt, tgt.clone().add(new THREE.Vector3().setFromSpherical(sph)));
    if (ui.chip) ui.chip.style.display = "flex";
    if (ui.chipName) ui.chipName.textContent = r.n;
    if (ui.chipAct) ui.chipAct.textContent = r.act;
    if (ui.chipSec) {
      // his section→room map makes this a one-liner: sec keys are anchor ids
      if (r.sec) { ui.chipSec.href = `#${r.sec}`; ui.chipSec.textContent = `open ${r.sec} ↗`; ui.chipSec.style.display = "inline-block"; }
      else ui.chipSec.style.display = "none";
    }
    ui.roomBtns.forEach((b) => {
      const isOn = b.dataset.room === k;
      b.style.background = isOn ? "#c96b4a" : "transparent";
      b.style.color = isOn ? "#fff" : "var(--h3d-ink)";
      b.style.borderColor = isOn ? "#c96b4a" : "var(--h3d-line)";
    });
    if (ui.insideBtn) ui.insideBtn.textContent = st.inside ? "pull back" : "step inside";
  }
  function overview() {
    st.focus = null; st.inside = false;
    flyTo(HOME_T.clone(), HOME_P.clone());
    if (ui.chip) ui.chip.style.display = "none";
    if (ui.insideBtn) ui.insideBtn.textContent = "step inside";
    ui.roomBtns.forEach((b) => { b.style.background = "transparent"; b.style.color = "var(--h3d-ink)"; b.style.borderColor = "var(--h3d-line)"; });
  }
  function setWalls(mode: string) {
    st.walls = mode; ui.wallBtns.forEach((b) => paint(b, b.dataset.wall === mode));
    for (const w of walls) {
      const m = w.mesh.material;
      m.opacity = 1; m.transparent = false; m.depthWrite = true;
      w.mesh.scale.y = 1; w.mesh.position.y = w.y0 + w.h / 2;
      if (mode === "line") { // thin floor line marking each area
        w.mesh.visible = !w.upper;
        if (!w.upper) { const k = Math.min(1, 0.16 / w.h); w.mesh.scale.y = k; w.mesh.position.y = w.y0 + (w.h * k) / 2; }
      } else if (mode === "low") w.mesh.visible = !w.upper;
      else w.mesh.visible = true;
    }
    const solidish = mode === "cutaway" || mode === "full";
    trims.forEach((m) => (m.visible = solidish));
  }
  function setLight(k: number, label: string) {
    st.light = k; ui.lightBtns.forEach((b) => paint(b, b.dataset.light === label));
    renderer.toneMappingExposure = 1.0 + (k - 1) * 0.3;
  }
  function setPalette(p: string) { st.palette = p; applyPalette(p); ui.palBtns.forEach((b) => paint(b, b.dataset.pal === p)); }

  /* ---------- walking ---------- */
  function walkTo(nodeKey: string) {
    if (nodeKey === st.node && !st.queue.length) return;
    if (opts.reduced) {
      st.node = nodeKey; st.queue = [];
      AV.position.set(N[nodeKey][0], 0, N[nodeKey][2]); setPose();
      return;
    }
    st.queue = path(st.node, nodeKey); st.from = N[st.node].slice(); st.prog = 0; st.pose = "walk";
  }
  function stepWalk(dt: number) {
    if (!st.queue.length || !st.from) return;
    const to = N[st.queue[0]], from = st.from;
    const d = Math.hypot(to[0] - from[0], to[2] - from[2]);
    st.prog += (1.4 * dt) / Math.max(0.25, d);
    const p = Math.min(1, st.prog);
    AV.position.set(from[0] + (to[0] - from[0]) * p, 0, from[2] + (to[2] - from[2]) * p);
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
      b.position.y = Math.abs(Math.sin(st.phase)) * 0.035; AV.rotation.x = 0; AV.position.y = 0;
    } else if (st.pose === "sit") {
      legL.rotation.x = legR.rotation.x = -1.45; armL.rotation.x = armR.rotation.x = -0.85;
      b.position.y = -0.4; AV.rotation.x = 0; AV.rotation.y = 0; AV.position.set(11.05, 0, 9.35);
    } else if (st.pose === "lie") {
      legL.rotation.x = legR.rotation.x = 0; armL.rotation.x = armR.rotation.x = -0.08;
      AV.rotation.x = -Math.PI / 2; AV.rotation.y = 0; b.position.y = 0; AV.position.set(11.25, 0.68, 2.5);
    } else {
      const br = Math.sin(performance.now() / 900) * 0.02;
      legL.rotation.x = legR.rotation.x = 0; armL.rotation.x = armR.rotation.x = 0.06 + br; b.position.y = br * 0.5; AV.rotation.x = 0; AV.position.y = 0;
    }
    AV.visible = st.showChar;
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
    sun.position.set(9 + Math.cos(a) * 30, Math.max(-6, Math.sin(a) * 26) + 2, 5.5 + 11 + Math.cos(a + 1.1) * 9);
    const L = st.light;
    sun.intensity = (1.45 * day + 0.14) * L; sun.color.setHex(day > 0.35 ? 0xfff2d8 : 0xffbf8a);
    hemi.intensity = (0.5 + day * 0.6) * L; hemi.color.copy(sky); amb.intensity = (0.3 + day * 0.14) * L;
    fill.intensity = 0.45 * L;
    const night = 1 - Math.min(1, day * 2.4);
    M.glass.emissive.setHex(0xffca7a); M.glass.emissiveIntensity = night * 0.55;
    M.lamp.emissiveIntensity = 0.1 + night * 0.95;
    M.screen.emissiveIntensity = 0.75 + night * 0.55; M.scrA.emissiveIntensity = M.scrB.emissiveIntensity = 0.6 + night * 0.5;
    rackGlow.intensity = 0.2 + night * 0.9;
    const s = slotAt(h), r = ROOMS[s[1]];
    roomLamp.intensity = night * 3.4 * L;
    roomLamp.position.set((r.x[0] + r.x[1]) / 2, 2.35, (r.z[0] + r.z[1]) / 2);
    if (st.focus) {
      const fr = ROOMS[st.focus];
      focusLamp.position.set((fr.x[0] + fr.x[1]) / 2, 2.35, (fr.z[0] + fr.z[1]) / 2);
      focusLamp.intensity = (1.7 + night * 4.4) * L;
    } else focusLamp.intensity = 0;
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
  ui.lightBtns.forEach((b) => (b.onclick = () => setLight(+b.dataset.k!, b.dataset.light!)));
  ui.palBtns.forEach((b) => (b.onclick = () => setPalette(b.dataset.pal!)));
  ui.roomBtns.forEach((b) => (b.onclick = () => focusRoom(b.dataset.room!, false)));
  const resetBtn = q<HTMLButtonElement>("reset");
  if (resetBtn) resetBtn.onclick = overview;
  if (ui.insideBtn) ui.insideBtn.onclick = () => { if (st.focus) focusRoom(st.focus, !st.inside); else focusRoom("office", true); };
  const nodeFor = (k: string) => (k === "hall" ? "c2" : N[k] ? k : "c2");
  const walkBtn = q<HTMLButtonElement>("walkBtn");
  if (walkBtn) walkBtn.onclick = () => { if (st.focus) walkTo(nodeFor(st.focus)); };
  if (ui.play) ui.play.onclick = () => { st.run = !st.run; ui.play!.textContent = st.run ? "❙❙ pause time" : "▶ play time"; };
  if (ui.slider) ui.slider.oninput = () => { st.t = +ui.slider!.value; st.run = false; if (ui.play) ui.play.textContent = "▶ play time"; };
  if (ui.dayLen) ui.dayLen.oninput = () => {
    st.dayLen = +ui.dayLen!.value;
    if (ui.dayLenVal) ui.dayLenVal.textContent = st.dayLen + " s / day";
  };
  const tog = (name: string, key: "showChar" | "showGarden" | "orbit", fn?: (v: boolean) => void) => {
    const el = q<HTMLButtonElement>(name);
    if (!el) return;
    el.onclick = () => { st[key] = !st[key]; paint(el, st[key]); fn?.(st[key]); };
    paint(el, st[key]);
  };
  tog("togChar", "showChar");
  tog("togGarden", "showGarden", (v) => G.env.children.forEach((c, i) => { if (i > 1) c.visible = v; }));
  tog("togOrbit", "orbit", (v) => (controls.autoRotate = v && !opts.reduced));
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
    const hit = ray.intersectObjects(G.pick.children, false)[0];
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
    if (st.run) { st.t = (st.t + (24 / st.dayLen) * dt) % 24; if (ui.slider && document.activeElement !== ui.slider) ui.slider.value = String(st.t); }
    const slot = applyTime();
    if (slot !== lastSlot) { lastSlot = slot; walkTo(slot[3]); }
    const hh = Math.floor(st.t), mm = Math.floor((st.t % 1) * 60);
    if (ui.clock) ui.clock.textContent = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    if (ui.nowRoom) ui.nowRoom.textContent = ROOMS[slot[1]].n.toUpperCase();
    if (ui.nowAct) ui.nowAct.textContent = slot[2];
    if (ui.nowSec) ui.nowSec.textContent = ROOMS[slot[1]].sec ? "→ section " + ROOMS[slot[1]].sec : "off the record";
    schedRows().forEach((row, i) => row.classList.toggle("is-now", SCHED[i] === slot));

    stepWalk(dt); applyPose();

    if (tween) {
      tween.k = Math.min(1, tween.k + dt / tween.dur); const e = ease(tween.k);
      controls.target.lerpVectors(tween.ft, tween.tt, e); camera.position.lerpVectors(tween.fp, tween.tp, e);
      if (tween.k >= 1) tween = null;
    }
    if (st.walls === "cutaway") {
      for (const w of walls) {
        const facing = camera.position.clone().sub(w.c).normalize().dot(w.n) > 0.12;
        w.mesh.visible = !facing;
      }
    }
    fill.position.copy(camera.position); fill.target.position.copy(controls.target);
    controls.target.x = Math.max(-6, Math.min(XW + 8, controls.target.x));
    controls.target.z = Math.max(-6, Math.min(ZD + 6, controls.target.z));
    controls.target.y = Math.max(0, Math.min(4.5, controls.target.y));
    controls.update();
    renderer.render(S, camera);
    raf = requestAnimationFrame(frame);
  }
  setWalls("line"); setPalette("clay"); setLight(1, "studio");
  // Land the avatar where the schedule says he is right now.
  const startSlot = slotAt(st.t);
  st.node = startSlot[3]; AV.position.set(N[st.node][0], 0, N[st.node][2]); setPose();
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
