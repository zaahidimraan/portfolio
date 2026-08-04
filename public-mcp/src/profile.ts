/**
 * Profile data for the public MCP server.
 *
 * Deliberately imports from the website's own content file so there is exactly
 * one source of truth: update `src/content/profile.ts` and both the site and
 * this server change together. Nothing is duplicated or paraphrased here.
 */

import {
  certificates,
  education,
  experience,
  flagships,
  identity,
  sideProjects,
  skillGroups,
  stats,
} from "../../src/content/profile";

export const SITE_URL = identity.siteUrl;

export const PROFILE = {
  identity: {
    name: identity.name,
    role: identity.role,
    currentEmployer: "POWWR (Innovation Team), since March 2026",
    location: identity.location,
    summary: identity.blurb,
    email: identity.email,
    github: identity.github,
    linkedin: identity.linkedin,
    portfolio: identity.siteUrl,
    mcpUrl: "https://ask-zahid.zaahidimraan.workers.dev",
    availability:
      "Open to AI engineering roles and agentic-systems problems. Based in Manchester, UK; " +
      "open to on-site, hybrid and remote. Requires UK Skilled Worker sponsorship.",
  },

  experience: experience.map((role) => ({
    title: role.title,
    company: role.company,
    dates: role.dates,
    achievements: role.bullets,
  })),

  projects: [
    ...flagships.map((p) => ({
      flagship: true,
      title: p.title,
      outcome: p.outcome,
      details: p.bullets,
      tech: p.tech,
      caseStudy: p.repoUrl,
    })),
    ...sideProjects.map((p) => ({
      flagship: false,
      title: p.title,
      outcome: p.outcome,
      details: p.bullets,
      tech: p.tech,
      caseStudy: p.repoUrl,
    })),
  ],

  skills: skillGroups,

  education: education.map((e) => ({
    degree: e.degree,
    school: e.school,
    dates: e.dates,
    modules: e.detail,
  })),

  certificates,

  metrics: stats.map((s) => ({
    value: `${s.prefix ?? ""}${s.value}${s.suffix}`,
    what: s.label,
    where: s.source,
  })),
} as const;
