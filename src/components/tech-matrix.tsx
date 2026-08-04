import { experience, flagships, skillLinks } from "@/content/profile";
import { projectAnchor, roleAnchor } from "@/lib/slug";

/**
 * Binary connection matrix: which technology is evidenced in which role or
 * flagship. A real <table> (not an SVG grid) so screen readers get row/column
 * semantics for free; filled square = used here, hairline = not.
 *
 * Data comes from the same hand-audited `skillLinks` map the skill chips use —
 * a mark appears only where a CV bullet supports it.
 */
export function TechMatrix() {
  const columns = [
    ...experience.map((role) => ({
      anchor: roleAnchor(role.company),
      short: role.company.split("·")[0].trim().split(" ")[0],
      full: `${role.title} · ${role.company}`,
    })),
    ...flagships.map((p) => ({
      anchor: projectAnchor(p.title),
      short: p.title.split(" ")[0].replace(/[^A-Za-z-]/g, ""),
      full: p.title,
    })),
  ];

  // Only techs with at least one link, most-connected first — real ordering.
  const rows = Object.entries(skillLinks)
    .map(([tech, anchors]) => ({ tech, anchors: new Set(anchors) }))
    .filter((row) => columns.some((c) => row.anchors.has(c.anchor)))
    .sort((a, b) => b.anchors.size - a.anchors.size || a.tech.localeCompare(b.tech));

  return (
    <figure className="my-8">
      <figcaption className="mb-4 font-mono text-[10px] uppercase tracking-wider text-muted">
        {rows.length} technologies × {columns.length} places · filled = evidenced by a CV bullet ·
        hover a row or column to trace it
      </figcaption>
      <div className="overflow-x-auto">
        <table className="tech-matrix w-full min-w-[640px] border-collapse text-left">
          <caption className="sr-only">
            Technology usage matrix: each row is a technology, each column a role or flagship
            project. A filled cell means that technology is evidenced there.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-[13rem] pb-3 font-mono text-[10px] font-normal uppercase tracking-wider text-muted">
                Technology
              </th>
              {columns.map((c) => (
                <th
                  key={c.anchor}
                  scope="col"
                  className="pb-3 align-bottom font-mono text-[10px] font-normal uppercase tracking-wider text-muted"
                >
                  <span className="block origin-bottom-left -rotate-45 whitespace-nowrap pl-3" title={c.full}>
                    {c.short}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.tech} className="group/row border-t border-border">
                <th
                  scope="row"
                  className="py-1.5 pr-3 font-mono text-xs font-normal text-foreground/85 transition-colors group-hover/row:text-foreground"
                >
                  {row.tech}
                </th>
                {columns.map((c) => {
                  const used = row.anchors.has(c.anchor);
                  return (
                    <td key={c.anchor} className="py-1.5 text-center">
                      {used ? (
                        <a
                          href={`#${c.anchor}`}
                          aria-label={`${row.tech} used in ${c.full} — open`}
                          className="mx-auto block size-3 rounded-[2px] bg-foreground transition-transform hover:scale-150"
                        />
                      ) : (
                        <span
                          aria-label={`${row.tech} not used in ${c.full}`}
                          className="mx-auto block size-3 rounded-[2px] border border-border"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
