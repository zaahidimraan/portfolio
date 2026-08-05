/**
 * Generates the PUBLIC CV PDF served at /Zahid-Imran-CV.pdf.
 *
 * Why this exists: the master CV (Google Doc, Career HQ) is Zahid's private
 * document and contains POWWR work detail that must not be published. The site
 * previously served an export of it. This script instead renders the CV from
 * `src/content/profile.ts` — the same already-sanitised data the site renders —
 * so the public download can never contain anything the page doesn't.
 *
 * Deliberate omissions vs the master CV:
 *   - no phone number (matches the site's existing anti-spam choice)
 *   - no POWWR metrics or internal architecture (hard rule, see AGENTS.md)
 *
 * Compression is disabled so the text stays greppable and CI can assert the
 * output is clean.
 */
import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import {
  certificates,
  education,
  experience,
  flagships,
  identity,
  sideProjects,
  skillGroups,
} from "../src/content/profile";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "public", "Zahid-Imran-CV.pdf");

/**
 * Every string written into the PDF, captured so the document can be audited
 * before it is finalised. pdfkit embeds subset fonts and writes text as hex
 * glyph ids, so the rendered bytes cannot be grepped — checking at the point of
 * writing is both simpler and stricter.
 */
const emitted: string[] = [];
const say = <T extends string>(value: T): T => {
  emitted.push(value);
  return value;
};

const BANNED: [RegExp, string][] = [
  [/99\.9/, "POWWR schema-compliance figure"],
  [/12,?000/, "POWWR record volume"],
  [/auto-match/i, "POWWR reconciliation metric"],
  [/schema compliance/i, "POWWR schema-compliance claim"],
  [/Docling|Dagster/i, "POWWR internal stack"],
  [/\bRPA\b/i, "replaced commercial product"],
  [/Innovation Team/i, "internal team name"],
  [/supplier energy|supplier contracts/i, "POWWR business detail"],
  [/company-wide/i, "internal initiative"],
  [/GPT-4o|Jaro-Winkler/i, "POWWR implementation detail"],
  [/\+44|7459267916/, "phone number (deliberately not published)"],
];

/** Refuse to ship a CV that breaches the publication rules in AGENTS.md. */
function auditOrThrow(): void {
  const text = emitted.join("\n");
  if (text.length < 2000) {
    throw new Error(`build-cv: only ${text.length} chars composed — CV looks incomplete.`);
  }
  const leaks = BANNED.filter(([re]) => re.test(text)).map(([, why]) => why);
  if (leaks.length) {
    throw new Error(`build-cv: PUBLICATION LEAK — ${leaks.join("; ")}`);
  }
  console.log(`build-cv: audit clean (${text.length} chars, ${BANNED.length} rules)`);
}

const INK = "#0a0a0a";
const MUTED = "#55595e";
const RULE = "#c9c9c9";
const PAGE_MARGIN = 44;

const doc = new PDFDocument({
  size: "A4",
  margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
  compress: false,
  info: {
    Title: `${identity.name} — CV`,
    Author: identity.name,
    Subject: identity.role,
  },
});
doc.pipe(createWriteStream(target));

const WIDTH = doc.page.width - PAGE_MARGIN * 2;

/** Start a new page before content that would otherwise be orphaned. */
function ensureSpace(needed: number): void {
  if (doc.y + needed > doc.page.height - PAGE_MARGIN) doc.addPage();
}

function sectionHeading(label: string): void {
  ensureSpace(46);
  doc.moveDown(0.7);
  doc
    .fillColor(INK)
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .text(say(label.toUpperCase()), { characterSpacing: 1.6 });
  doc.moveDown(0.25);
  const y = doc.y;
  doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + WIDTH, y).lineWidth(0.75).strokeColor(RULE).stroke();
  doc.moveDown(0.55);
}

/** Heading on the left, dates right-aligned on the same baseline. */
function entryHeader(left: string, right: string, sub?: string): void {
  ensureSpace(52);
  const y = doc.y;
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10.5).text(say(left), PAGE_MARGIN, y, {
    width: WIDTH - 150,
    continued: false,
  });
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(9)
    .text(say(right), PAGE_MARGIN + WIDTH - 150, y, { width: 150, align: "right" });
  doc.y = Math.max(doc.y, y + 13);
  if (sub) {
    doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(9.5).text(say(sub), PAGE_MARGIN, doc.y);
  }
  doc.moveDown(0.3);
}

function bullets(items: readonly string[]): void {
  doc.fillColor(INK).font("Helvetica").fontSize(9.5);
  for (const item of items) {
    ensureSpace(26);
    const y = doc.y;
    doc.text("•", PAGE_MARGIN + 2, y, { width: 10 });
    doc.text(say(item), PAGE_MARGIN + 14, y, { width: WIDTH - 14, align: "left", lineGap: 1.2 });
    doc.moveDown(0.22);
  }
}

// ---- Header -----------------------------------------------------------------
doc.fillColor(INK).font("Helvetica-Bold").fontSize(26).text(say(identity.name.toUpperCase()), {
  characterSpacing: 1,
});
doc.moveDown(0.15);
doc.fillColor(INK).font("Helvetica").fontSize(11.5).text(say(identity.role));
doc.moveDown(0.3);
// Phone deliberately omitted — this copy is published on the web.
doc
  .fillColor(MUTED)
  .fontSize(9)
  .text(
    say(
      [
        identity.location,
        identity.email,
        identity.siteUrl.replace("https://", ""),
        identity.linkedin.replace("https://www.", "").replace(/\/$/, ""),
        identity.github.replace("https://", ""),
      ].join("  ·  "),
    ),
  );

doc.moveDown(0.6);
doc.fillColor(INK).font("Helvetica").fontSize(9.5).text(say(identity.blurb), { lineGap: 1.5 });

// ---- Experience -------------------------------------------------------------
sectionHeading("Experience");
for (const role of experience) {
  entryHeader(`${role.title} — ${role.company}`, role.dates);
  bullets(role.bullets);
  doc.moveDown(0.35);
}

// ---- Selected projects ------------------------------------------------------
sectionHeading("Selected projects");
for (const project of flagships) {
  entryHeader(project.title, "", project.outcome);
  bullets(project.bullets);
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(8.5)
    .text(say(project.tech.join(" · ")), { lineGap: 0.5 });
  doc.moveDown(0.4);
}

// ---- Further projects -------------------------------------------------------
sectionHeading("Further projects");
for (const project of sideProjects) {
  ensureSpace(34);
  doc
    .fillColor(INK)
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .text(say(project.title), { continued: true });
  doc.font("Helvetica").fillColor(INK).text(say(` — ${project.outcome}`), { lineGap: 1 });
  doc.fillColor(MUTED).fontSize(8.5).text(say(project.tech.join(" · ")));
  doc.moveDown(0.32);
}

// ---- Skills -----------------------------------------------------------------
sectionHeading("Skills");
for (const group of skillGroups) {
  ensureSpace(24);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(9.5).text(say(`${group.label}: `), {
    continued: true,
  });
  doc.font("Helvetica").fillColor(INK).text(say(group.items.join(", ")), { lineGap: 1 });
  doc.moveDown(0.22);
}

// ---- Education --------------------------------------------------------------
sectionHeading("Education");
for (const entry of education) {
  entryHeader(entry.degree, entry.dates, entry.school);
  doc.fillColor(MUTED).font("Helvetica").fontSize(8.5).text(say(entry.detail), { lineGap: 0.8 });
  doc.moveDown(0.35);
}

// ---- Certificates -----------------------------------------------------------
sectionHeading(`Certificates (${certificates.length})`);
doc.fillColor(INK).font("Helvetica").fontSize(9);
for (const cert of certificates) {
  ensureSpace(16);
  doc.text(say(`${cert.name} — ${cert.issuer}, ${cert.date}`), { lineGap: 0.6 });
}

// Audit before finalising: a leak throws, and nothing usable is written.
auditOrThrow();

doc.end();
console.log("build-cv: generated public CV -> public/Zahid-Imran-CV.pdf");
