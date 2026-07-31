import { identity, repoDenylist } from "@/content/profile";

export type Repo = {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  pushedAt: string;
};

type GitHubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  pushed_at: string;
  fork: boolean;
};

/**
 * Build-time fetch of public repos. Fails loudly on any error — an empty
 * projects grid must never ship silently (PORT-3 acceptance criteria).
 */
export async function getRepos(): Promise<Repo[]> {
  const res = await fetch(
    `https://api.github.com/users/${identity.githubUser}/repos?per_page=100&sort=pushed`,
    { headers: { Accept: "application/vnd.github+json" } },
  );
  if (!res.ok) {
    throw new Error(
      `GitHub API returned ${res.status} for ${identity.githubUser} — aborting build rather than shipping an empty grid.`,
    );
  }
  const repos = (await res.json()) as GitHubRepo[];
  return repos
    .filter((r) => !r.fork && !repoDenylist.has(r.name))
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      url: r.html_url,
      pushedAt: r.pushed_at,
    }));
}
