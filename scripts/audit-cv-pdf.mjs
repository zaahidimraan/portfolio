/**
 * Independent, artifact-level audit of the generated public CV.
 *
 * build-cv.ts audits the text it composes; this re-reads the finished PDF and
 * checks again, so a bug in the generator cannot let material through. Run
 * manually or in CI: `node scripts/audit-cv-pdf.mjs`.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, "public", "Zahid-Imran-CV.pdf"), "latin1");

// pdfkit writes show-text as [<hex> kern <hex> ...] TJ, and occasionally as a
// (literal) Tj. Decode both; hex is the common case here.
const TEXT_OP = /\[([^\]]*)\]\s*TJ|\(((?:[^()\\]|\\.)*)\)\s*Tj/g;
const HEX = /<([0-9A-Fa-f]+)>/g;
const LITERAL = /\(((?:[^()\\]|\\.)*)\)/g;

const fromHex = (hex) => Buffer.from(hex, "hex").toString("latin1");

let text = "";
for (const m of raw.matchAll(TEXT_OP)) {
  if (m[2] !== undefined) {
    text += `${m[2]} `;
    continue;
  }
  const group = m[1];
  const decoded =
    [...group.matchAll(HEX)].map((h) => fromHex(h[1])).join("") ||
    [...group.matchAll(LITERAL)].map((g) => g[1]).join("");
  text += `${decoded} `;
}
text = text.replace(/\\([()\\])/g, "$1");

const BANNED = [
  [/99\.9/, "schema-compliance figure"],
  [/12,?000/, "record volume"],
  [/auto-match/i, "reconciliation metric"],
  [/schema compliance/i, "schema-compliance claim"],
  [/Docling|Dagster/i, "internal stack"],
  [/\bRPA\b/i, "replaced commercial product"],
  [/Innovation Team/i, "internal team name"],
  [/supplier energy|supplier contracts/i, "business detail"],
  [/company-wide/i, "internal initiative"],
  [/GPT-4o|Jaro-Winkler/i, "implementation detail"],
  [/\+44|7459267916/, "phone number"],
];

const EXPECTED = ["ZAHID IMRAN", "EXPERIENCE", "POWWR", "SKILLS", "EDUCATION", "CERTIFICATES"];

if (text.length < 2000) {
  console.error(`audit-cv-pdf: only ${text.length} chars readable — cannot audit. Failing closed.`);
  process.exit(1);
}

const missing = EXPECTED.filter((k) => !text.includes(k));
if (missing.length) {
  console.error(`audit-cv-pdf: CV is missing expected sections: ${missing.join(", ")}`);
  process.exit(1);
}

const leaks = BANNED.filter(([re]) => re.test(text)).map(([, why]) => why);
if (leaks.length) {
  console.error(`audit-cv-pdf: PUBLICATION LEAK — ${leaks.join("; ")}`);
  process.exit(1);
}

console.log(
  `audit-cv-pdf: clean — ${text.length} chars read from the PDF, ${BANNED.length} rules, all ${EXPECTED.length} sections present`,
);
