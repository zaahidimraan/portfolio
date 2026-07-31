import { CareerTimeline } from "@/components/career-timeline";
import { Contact } from "@/components/contact";
import { Experience } from "@/components/experience";
import { FlagshipProjects } from "@/components/flagship-projects";
import { GitHubGrid } from "@/components/github-grid";
import { Hero } from "@/components/hero";
import { LanguageChart } from "@/components/language-chart";
import { Nav } from "@/components/nav";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { StatCounters } from "@/components/stat-counters";
import { Certificates, Skills } from "@/components/skills";
import { getRepos } from "@/lib/github";

export default async function Home() {
  const repos = await getRepos();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5">
        <Hero />
        <Section id="impact" number="01" title="Impact in numbers">
          <StatCounters />
        </Section>
        <Section id="projects" number="02" title="Selected projects">
          <FlagshipProjects />
          <h3 className="mb-2 mt-14 text-lg font-semibold tracking-tight">More from GitHub</h3>
          <Reveal>
            <LanguageChart repos={repos} />
            <GitHubGrid repos={repos} />
          </Reveal>
        </Section>
        <Section id="experience" number="03" title="Experience">
          <Reveal>
            <CareerTimeline />
          </Reveal>
          <div className="mt-12">
            <Experience />
          </div>
        </Section>
        <Section id="skills" number="04" title="Skills">
          <Reveal>
            <Skills />
          </Reveal>
        </Section>
        <Section id="certificates" number="05" title="Certificates">
          <Reveal>
            <Certificates />
          </Reveal>
        </Section>
        <Contact />
      </main>
    </>
  );
}
