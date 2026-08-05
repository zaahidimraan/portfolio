import { CareerTimeline } from "@/components/career-timeline";
import { CertStrip } from "@/components/cert-strip";
import { Contact } from "@/components/contact";
import { CrossLinks } from "@/components/cross-links";
import { Experience } from "@/components/experience";
import { FlagshipProjects } from "@/components/flagship-projects";
import { GitHubSection } from "@/components/github-section";
import { Hero } from "@/components/hero";
import { McpSection } from "@/components/mcp-section";
import { Nav } from "@/components/nav";
import { RepoTimeline } from "@/components/repo-timeline";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { SideProjects } from "@/components/side-projects";
import { Walker } from "@/components/walker";
import { StatCounters } from "@/components/stat-counters";
import { Certificates, Skills } from "@/components/skills";
import { TechMatrix } from "@/components/tech-matrix";
import { TimelinePanel } from "@/components/timeline-panel";
import { getRepos } from "@/lib/github";
import { homeSchema } from "@/lib/seo";

export default async function Home() {
  const repos = await getRepos();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema()) }}
      />
      <Nav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5">
        <Hero />

        <Section
          id="impact"
          number="01"
          title="Impact in numbers"
          intro="Measured results from production systems — every number links to its proof"
        >
          <Reveal>
            <StatCounters />
          </Reveal>
        </Section>

        <Section
          id="projects"
          number="02"
          title="Selected projects"
          intro="Three flagship builds with their architectures, then everything else"
        >
          <FlagshipProjects />
          <h3 className="mb-4 mt-14 text-lg font-semibold tracking-tight">Also built</h3>
          <Reveal>
            <SideProjects />
          </Reveal>
          <h3 className="mb-2 mt-14 text-lg font-semibold tracking-tight">More from GitHub</h3>
          <Reveal>
            <GitHubSection repos={repos} />
            <RepoTimeline repos={repos} />
          </Reveal>
        </Section>

        <Section
          id="experience"
          number="03"
          title="Experience"
          intro="Click any bar to open the full entry — concurrent roles show in parallel"
        >
          <Reveal>
            <CareerTimeline />
          </Reveal>
          <TimelinePanel />
          <div className="mt-12">
            <Experience />
          </div>
        </Section>

        <Section
          id="skills"
          number="04"
          title="Skills"
          intro="Chips with a count are clickable — they light up the work that proves them"
        >
          <Reveal>
            <Skills />
          </Reveal>
          <h3 className="mb-2 mt-14 text-lg font-semibold tracking-tight">
            Where each technology was used
          </h3>
          <Reveal>
            <TechMatrix />
          </Reveal>
        </Section>

        <Section
          id="certificates"
          number="05"
          title="Certificates"
          intro="Fifteen certificates across three tracks — the lanes show where the focus went"
        >
          <Reveal>
            <CertStrip />
            <Certificates />
          </Reveal>
        </Section>

        <Section
          id="mcp"
          number="06"
          title="Ask my portfolio"
          intro="A live MCP server — connect an AI client and question my CV directly"
        >
          <Reveal>
            <McpSection />
          </Reveal>
        </Section>

        <Walker label="Available for freelance work →" />
        <Contact />
      </main>
      <CrossLinks />
    </>
  );
}
