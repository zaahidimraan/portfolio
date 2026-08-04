/**
 * Copies the master CV PDF from Career HQ into public/ before each build.
 * Falls back to the already-committed copy when Career HQ isn't present
 * (e.g. CI); fails only if no CV exists at all.
 */
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// This repo lives inside Career HQ, so the master CV is one level up.
// Resolved relatively so moving or cloning the tree can't break the link.
const source = join(root, "..", "00-master-cv", "Zahid-Imran-CV.pdf");
const target = join(root, "public", "Zahid-Imran-CV.pdf");

if (existsSync(source)) {
  copyFileSync(source, target);
  console.log(`sync-cv: copied master CV -> public/Zahid-Imran-CV.pdf`);
} else if (existsSync(target)) {
  console.warn(`sync-cv: Career HQ not found; keeping committed public/Zahid-Imran-CV.pdf`);
} else {
  console.error(`sync-cv: no CV found at ${source} or ${target} — a portfolio without a CV must not ship.`);
  process.exit(1);
}
