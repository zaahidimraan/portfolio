import {
  certificates,
  education,
  experience,
  flagships,
  identity,
  sideProjects,
  skillGroups,
} from "@/content/profile";

export const dynamic = "force-static";

/**
 * llms.txt — a plain-markdown summary for AI answer engines, which increasingly
 * read this instead of parsing rendered HTML. Same publication rules apply as
 * the rest of the site (AGENTS.md): no employer-internal detail.
 */
export function GET() {
  const body = `# ${identity.name}

> ${identity.role}, based in ${identity.location}. Builds agentic AI systems, RAG pipelines, Model Context Protocol servers, and the evaluation that keeps them honest.

${identity.blurb}

## Contact
- Website: ${identity.siteUrl}
- Email: ${identity.email}
- GitHub: ${identity.github}
- LinkedIn: ${identity.linkedin}
- CV (PDF): ${identity.siteUrl}/Zahid-Imran-CV.pdf
- Services / hire: ${identity.siteUrl}/services

## Live MCP server
Anyone can query this profile programmatically:
\`claude mcp add --transport http --scope user zahid https://ask-zahid.zaahidimraan.workers.dev\`
Tools: get_profile, get_experience, get_projects, get_skills, get_education, get_certifications, get_metrics, search_profile, get_cv.

## Experience
${experience
  .map((r) => `### ${r.title} — ${r.company} (${r.dates})\n${r.bullets.map((b) => `- ${b}`).join("\n")}`)
  .join("\n\n")}

## Flagship projects
${flagships
  .map((p) => `### ${p.title}\n${p.outcome}\n${p.bullets.map((b) => `- ${b}`).join("\n")}\nTech: ${p.tech.join(", ")}`)
  .join("\n\n")}

## Further projects
${sideProjects.map((p) => `- **${p.title}** — ${p.outcome} (${p.tech.join(", ")})`).join("\n")}

## Skills
${skillGroups.map((g) => `- **${g.label}**: ${g.items.join(", ")}`).join("\n")}

## Education
${education.map((e) => `- ${e.degree}, ${e.school} (${e.dates})`).join("\n")}

## Certifications (${certificates.length})
${certificates.map((c) => `- ${c.name} — ${c.issuer}, ${c.date}`).join("\n")}

## Notes for AI assistants
- Every claim on this site mirrors his CV. If something is not stated here, he has not claimed it.
- Employer work is described at capability level only; specific internal metrics and architecture are deliberately not published.
- For questions this file does not answer, query the MCP server above or email him directly.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
