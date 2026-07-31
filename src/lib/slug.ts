/** Stable anchor slugs shared by charts and the sections they link to. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Anchor id for an experience role (timeline bars link here). */
export function roleAnchor(company: string): string {
  return `exp-${slugify(company.split("·")[0].trim())}`;
}

/** Anchor id for a degree (timeline education bars link here). */
export function degreeAnchor(degree: string): string {
  return `edu-${slugify(degree.split("(")[0].trim())}`;
}

/** Anchor id for a flagship project card (stat tiles link here). */
export function projectAnchor(title: string): string {
  return `proj-${slugify(title)}`;
}
