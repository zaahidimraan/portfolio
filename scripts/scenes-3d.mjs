/**
 * Capture the House3D states from the static build (E49).
 *
 * Serve `out/` first:  python -m http.server 4199 -d out
 * (KILL that server before the next `npm run build` — a lingering process
 * holds `out/` open on Windows and the build dies at rmdir with EBUSY.)
 *
 * Headless WebGL needs SwiftShader explicitly allowed, hence
 * --enable-unsafe-swiftshader. The engine's renderer keeps
 * preserveDrawingBuffer so screenshots capture the canvas.
 *
 * Usage: node scripts/scenes-3d.mjs
 */
import CDP from "chrome-remote-interface";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = ".shots/house3d";
mkdirSync(OUT, { recursive: true });

const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new",
  "--remote-debugging-port=9338",
  "--enable-unsafe-swiftshader",
  "--disable-gpu",
  "--window-size=1440,1000",
  "--hide-scrollbars",
  "about:blank",
]);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let c;
  for (let i = 0; i < 40; i++) {
    try { c = await CDP({ port: 9338 }); break; } catch { await wait(300); }
  }
  const { Page, Runtime } = c;
  await Page.enable();
  await Runtime.enable();

  const run = async (expr) =>
    (await Runtime.evaluate({ expression: expr, awaitPromise: true, returnByValue: true })).result.value;

  const shot = async (name) => {
    const { data } = await Page.captureScreenshot({ format: "png" });
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, "base64"));
    console.log("captured", name);
  };

  // Load, scroll the section into view (mounts the engine via IO), and wait
  // for the canvas; one reload retry absorbs first-visit chunk races.
  let ready = "";
  for (let attempt = 0; attempt < 2 && ready !== "ready"; attempt++) {
    await Page.navigate({ url: "http://localhost:4199/" });
    await Page.loadEventFired();
    await wait(1800);
    // behavior:"instant" — the page uses scroll-behavior:smooth, and a smooth
    // programmatic scroll never lands reliably headless (see scenes lesson #1).
    await run(`document.getElementById("office").scrollIntoView({ behavior: "instant", block: "start" })`);
    ready = await run(`(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let i = 0; i < 60; i++) {
        const canvas = document.querySelector(".h3d-stage canvas");
        const status = document.querySelector(".h3d")?.dataset.status;
        if (canvas && status === "ready") return "ready";
        if (status === "unsupported") return "unsupported";
        await wait(300);
      }
      return "timeout:" + (document.querySelector(".h3d")?.dataset.status ?? "no-root");
    })()`);
    console.log(`engine (attempt ${attempt + 1}):`, ready);
  }
  if (ready !== "ready") process.exit(1);

  const setTime = async (h) => {
    await run(`(() => {
      const sl = document.querySelector('[data-h3d="timeSlider"]');
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      set.call(sl, "${h}");
      sl.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
  };

  // 1 · midday overview — WALLS defaults to line (v2)
  await setTime(11);
  await wait(1500);
  await shot("01-day-line");

  // 2 · night — lamps, screens, rack glow, page theme dark
  await setTime(23.4);
  await wait(2600);
  await shot("02-night");

  // 3 · office focus (chip + section link + fly-to)
  await setTime(10);
  await run(`document.querySelector('[data-room="office"]').click()`);
  await wait(1800);
  await shot("03-office");

  // 4 · step inside the office
  await run(`document.querySelector('[data-h3d="insideBtn"]').click()`);
  await wait(1700);
  await shot("04-office-inside");

  // 5 · reset, walls cutaway (camera-facing hide), palette dusk
  await run(`document.querySelector('[data-h3d="reset"]').click()`);
  await wait(1400);
  await run(`document.querySelector('[data-wall="cutaway"]').click()`);
  await run(`document.querySelector('[data-pal="dusk"]').click()`);
  await wait(1200);
  await shot("05-cutaway-dusk");

  // functional: schedule row jumps time + focus; chip carries the section link
  const func = await run(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    document.querySelector('[data-wall="line"]').click();
    document.querySelector('[data-pal="clay"]').click();
    const rows = [...document.querySelectorAll(".h3d-schedrow")];
    rows[3].click(); // 09:00 office
    await wait(1500);
    const clock = document.querySelector('[data-h3d="clock"]').textContent;
    const room = document.querySelector('[data-h3d="nowRoom"]').textContent;
    const sec = document.querySelector('[data-h3d="nowSec"]').textContent;
    const chipSec = document.querySelector('[data-h3d="chipSec"]');
    const link = chipSec.style.display !== "none" ? chipSec.getAttribute("href") : "hidden";
    return JSON.stringify({ clock, room, sec, link });
  })()`);
  console.log("schedule-row check:", func);

  // functional: SiteMotion — hover a card, expect a transform + shadow
  const motion = await run(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const card = [...document.querySelectorAll("main article, main a[href]")].find(
      (el) => el.offsetHeight > 60 && el.offsetHeight < 600,
    );
    if (!card) return JSON.stringify({ motion: "no-card" });
    card.dispatchEvent(new PointerEvent("pointerenter", { bubbles: false }));
    await wait(150);
    return JSON.stringify({
      fx: card.dataset.fxLast ?? "none",
      transformed: (card.style.transform || "").length > 0,
    });
  })()`);
  console.log("site-motion check:", motion);

  await c.close();
} finally {
  chrome.kill();
}
