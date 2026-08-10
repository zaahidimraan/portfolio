/**
 * Capture the isometric house's states from a real Chrome (E45).
 *
 * Serves nothing itself — run a static server over out/ first, e.g.
 *   python -m http.server 4199 -d out
 * then:
 *   node scripts/scenes-house.mjs
 *
 * ⚠ Stop that server before the next `next build` — a lingering process holds
 * out/ open on Windows and the build dies at its final rmdir with EBUSY.
 *
 * Deterministic states come from two storage hooks the site reads on boot:
 *   localStorage.houseIntroSeen  — "1" skips the intro
 *   sessionStorage.houseClock    — pins the scene clock (minute of day)
 */

import CDP from "chrome-remote-interface";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

const URL = "http://localhost:4199/";
const OUT = ".shots/house";
mkdirSync(OUT, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new",
  "--remote-debugging-port=9338",
  "--disable-gpu",
  "--window-size=1440,1000",
  "--hide-scrollbars",
  "about:blank",
]);

try {
  let c;
  for (let i = 0; i < 40; i++) {
    try { c = await CDP({ port: 9338 }); break; } catch { await wait(300); }
  }
  const { Page, Runtime, Emulation } = c;
  await Page.enable();

  const boot = async (pre, viewport) => {
    if (viewport) {
      await Emulation.setDeviceMetricsOverride({ width: viewport[0], height: viewport[1], deviceScaleFactor: 1, mobile: viewport[0] < 800 });
    }
    const { identifier } = await Page.addScriptToEvaluateOnNewDocument({ source: pre });
    await Page.navigate({ url: URL });
    await Page.loadEventFired();
    await wait(1200);
    await Runtime.evaluate({
      expression: `document.getElementById("office").scrollIntoView({behavior:"instant",block:"start"}); window.scrollBy(0,-40)`,
    });
    await wait(1400);
    return identifier;
  };

  const shot = async (name) => {
    const { data } = await Page.captureScreenshot({ format: "png" });
    const { writeFileSync } = await import("node:fs");
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, "base64"));
    console.log(`captured ${name}`);
  };

  const click = async (sel) => {
    await Runtime.evaluate({
      expression: `document.querySelector(${JSON.stringify(sel)})?.dispatchEvent(new MouseEvent("click",{bubbles:true}))`,
    });
  };

  const FULL = !process.argv.includes("--fixes");

  // 1 · the intro, mid-beats (fresh visitor)
  if (FULL) {
    const id0 = await boot(`localStorage.removeItem("houseIntroSeen"); localStorage.removeItem("theme"); sessionStorage.setItem("houseClock","690")`);
    await shot("01-intro");
    await wait(6000);
    await Page.removeScriptToEvaluateOnNewDocument({ identifier: id0 });
  }
  let id;

  // 2 · day, deep-work hour — avatar sitting at the desk
  id = await boot(`localStorage.setItem("houseIntroSeen","1"); localStorage.removeItem("theme"); sessionStorage.setItem("houseClock","690")`);
  await shot("02-day");
  await Page.removeScriptToEvaluateOnNewDocument({ identifier: id });

  // 2b · mid-walk (desk → kitchen, rounding the sofa in the drawing room)
  id = await boot(`localStorage.setItem("houseIntroSeen","1"); localStorage.removeItem("theme"); sessionStorage.setItem("houseClock","757")`);
  await shot("02b-walk");
  await Page.removeScriptToEvaluateOnNewDocument({ identifier: id });

  // 3 · night — asleep, warm bedroom glow, cold server glow, page dark
  id = await boot(`localStorage.setItem("houseIntroSeen","1"); localStorage.removeItem("theme"); sessionStorage.setItem("houseClock","1390")`);
  await wait(3200);
  await shot("03-night");
  await Page.removeScriptToEvaluateOnNewDocument({ identifier: id });

  // 4 · office close-up (three monitors + chair + rack beside)
  id = await boot(`localStorage.setItem("houseIntroSeen","1"); localStorage.removeItem("theme"); sessionStorage.setItem("houseClock","690")`);
  await click('.hs-hit polygon[aria-label^="office"]');
  await wait(1100);
  await shot("04-zoom-office");

  // 5 · server close-up (rack LEDs + CRT status)
  await Runtime.evaluate({ expression: `window.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}))` });
  await wait(400);
  await click('.hs-hit polygon[aria-label^="server"]');
  await wait(1100);
  await shot("05-zoom-server");
  await Page.removeScriptToEvaluateOnNewDocument({ identifier: id });

  // 7 · hover label + scrub check (E46)
  if (process.argv.includes("--polish")) {
    id = await boot(`localStorage.setItem("houseIntroSeen","1"); localStorage.removeItem("theme"); sessionStorage.setItem("houseClock","690")`);
    await Runtime.evaluate({
      expression: `document.querySelector('.hs-hit polygon[aria-label^="bedroom"]')?.dispatchEvent(new MouseEvent("mouseover",{bubbles:true}))`,
    });
    await wait(600);
    await shot("07-hover-bedroom");
    const { result } = await Runtime.evaluate({
      returnByValue: true,
      awaitPromise: true,
      expression: `(async () => {
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        const sl = document.querySelector(".house-scrub input");
        const fig = document.querySelector(".house-avatar");
        const before = fig.getAttribute("transform") + "|" + fig.getAttribute("data-pose");
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        set.call(sl, "1420"); sl.dispatchEvent(new Event("input", { bubbles: true }));
        await wait(600);
        const after = fig.getAttribute("transform") + "|" + fig.getAttribute("data-pose");
        const clock = document.querySelector(".house-now-head span:last-child").textContent;
        return JSON.stringify({ moved: before !== after, pose: after.split("|")[1], clock });
      })()`,
    });
    console.log("scrub:", result.value);
    await wait(400);
    await shot("08-scrubbed-night");
    await Page.removeScriptToEvaluateOnNewDocument({ identifier: id });
  }

  // 6 · mobile, day — dock stacked under the house
  if (FULL) {
    await boot(
      `localStorage.setItem("houseIntroSeen","1"); localStorage.removeItem("theme"); sessionStorage.setItem("houseClock","690")`,
      [390, 1400],
    );
    await shot("06-mobile");
  }

  await c.close();
} finally {
  chrome.kill();
}
