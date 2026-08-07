// Scrolled, painted screenshots of the built site — the only capture method
// that survives content-visibility paint-skipping and CSS entrance animations.
// Usage: node scripts/shots.mjs <url> <outdir> [selector...]
import CDP from "chrome-remote-interface";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const [url, outdir, ...selectors] = process.argv.slice(2);
if (!url || !outdir) {
  console.error("usage: node scripts/shots.mjs <url> <outdir> [selector...]");
  process.exit(1);
}
mkdirSync(outdir, { recursive: true });

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333;
const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  "--disable-gpu",
  "--force-prefers-reduced-motion", // the site's designed static state
  "--window-size=1440,1000",
  "--hide-scrollbars",
  "about:blank",
]);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let client;
  for (let i = 0; i < 30; i++) {
    try {
      client = await CDP({ port: PORT });
      break;
    } catch {
      await wait(300);
    }
  }
  if (!client) throw new Error("could not reach Chrome's debugging port");
  const { Page, Runtime, Emulation } = client;
  await Page.enable();
  await Page.navigate({ url });
  await Page.loadEventFired();
  await wait(1200);
  await Emulation.setDeviceMetricsOverride({ width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  const shoot = async (name) => {
    await wait(700); // let paint settle after scroll
    const { data } = await Page.captureScreenshot({ format: "png" });
    writeFileSync(`${outdir}/${name}.png`, Buffer.from(data, "base64"));
    console.log(`${name}.png`);
  };

  await shoot("top");
  for (const sel of selectors) {
    const name = sel.replace(/[^a-z0-9-]/gi, "_");
    const { result } = await Runtime.evaluate({
      expression: `(() => { const el = document.querySelector(${JSON.stringify(sel)});
        if (!el) return "MISSING";
        const y = el.getBoundingClientRect().top + scrollY - 70;
        scrollTo({ top: y, behavior: "instant" }); return "ok"; })()`,
      returnByValue: true,
    });
    if (result.value !== "ok") {
      console.error(`${sel}: ${result.value}`);
      continue;
    }
    await shoot(name);
  }
  await client.close();
} finally {
  chrome.kill();
}
