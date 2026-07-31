import { Contact } from "@/components/contact";
import { Experience } from "@/components/experience";
import { FlagshipProjects } from "@/components/flagship-projects";
import { GitHubGrid } from "@/components/github-grid";
import { Hero } from "@/components/hero";
import { Nav } from "@/components/nav";
import { Section } from "@/components/section";
import { Certificates, Skills } from "@/components/skills";
import { getRepos } from "@/lib/github";

export default async function Home() {
  const repos = await getRepos();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5">
        <Hero />
        <Section id="projects" title="Selected Projects">
          <FlagshipProjects />
          <h3 className="mb-4 mt-12 font-semibold">More from GitHub</h3>
          <GitHubGrid repos={repos} />
        </Section>
        <Section id="experience" title="Experience">
          <Experience />
        </Section>
        <Section id="skills" title="Skills">
          <Skills />
        </Section>
        <Section id="certificates" title="Certificates">
          <Certificates />
        </Section>
        <Contact />
      </main>
    </>
  );
}
