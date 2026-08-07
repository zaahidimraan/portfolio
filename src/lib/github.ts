import { identity, repoDenylist } from "@/content/profile";

export type Repo = {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  pushedAt: string;
  createdAt: string;
};

type GitHubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  pushed_at: string;
  created_at: string;
  fork: boolean;
};

/**
 * Build-time fetch of public repos. Fails loudly on any error — an empty
 * projects grid must never ship silently (PORT-3 acceptance criteria).
 */
export async function getRepos(): Promise<Repo[]> {
  // GITHUB_TOKEN is optional locally; CI sets it to avoid shared-runner rate limits.
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  // Static export can't use `no-store` (it forces the route dynamic), and
  // Next caches build-time fetches by URL — so vary the URL per build to
  // guarantee each deploy ships the live repo list. GitHub ignores the param.
  const bust = process.env.BUILD_ID ?? Date.now().toString();
  const res = await fetch(
    `https://api.github.com/users/${identity.githubUser}/repos?per_page=100&sort=pushed&_=${bust}`,
    { headers },
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
      createdAt: r.created_at,
    }));
}

export type CommitHistory = {
  /** "YYYY-MM" → total commits across all public repos that month. */
  months: Record<string, number>;
  /** repo name → "YYYY-MM" → commits, for per-month attribution. */
  byRepo: Record<string, Record<string, number>>;
};

/**
 * Build-time commit history across the public repos (GIT-1).
 *
 * Unlike getRepos this degrades gracefully: commit listing costs one request
 * per repo page against a 60/hr unauthenticated limit, so any failure returns
 * null and the chart simply doesn't render — a missing chart is honest, a
 * broken build over decoration is not.
 */
export async function getCommitHistory(repos: Repo[]): Promise<CommitHistory | null> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const bust = process.env.BUILD_ID ?? Date.now().toString();

  const months: Record<string, number> = {};
  const byRepo: Record<string, Record<string, number>> = {};

  try {
    for (const repo of repos) {
      const perRepo: Record<string, number> = {};
      // Up to 3 pages (300 commits) per repo — these are personal repos, and a
      // hard cap keeps the build inside the rate limit even if one grows.
      for (let page = 1; page <= 3; page++) {
        const res = await fetch(
          `https://api.github.com/repos/${identity.githubUser}/${repo.name}/commits?per_page=100&page=${page}&_=${bust}`,
          { headers },
        );
        if (res.status === 409) break; // empty repository — zero commits, not a failure
        if (!res.ok) {
          if (page === 1) throw new Error(`commits ${repo.name}: ${res.status}`);
          break; // later pages: an empty tail is fine
        }
        const commits = (await res.json()) as { commit: { author: { date: string } } }[];
        for (const c of commits) {
          const key = c.commit.author.date.slice(0, 7); // YYYY-MM
          perRepo[key] = (perRepo[key] ?? 0) + 1;
          months[key] = (months[key] ?? 0) + 1;
        }
        if (commits.length < 100) break;
      }
      byRepo[repo.name] = perRepo;
    }
  } catch (error) {
    console.warn(`commit history unavailable this build: ${error}`);
    return null;
  }

  return { months, byRepo };
}
