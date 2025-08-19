export type LanguageStat = {
  name: string;
  bytes: number;
};

export type AggregatedLanguage = {
  name: string;
  bytes: number;
  percent: number;
  estimatedLines: number;
  committedAllLines?: number;
  committedUserLines?: number;
};

const AVERAGE_BYTES_PER_LINE = 50; // fallback heuristic
const BYTES_PER_LINE_BY_LANGUAGE: Record<string, number> = {
  TypeScript: 42,
  JavaScript: 42,
  Python: 38,
  Java: 45,
  Go: 44,
  C: 40,
  "C++": 44,
  "C#": 44,
  PHP: 46,
  Ruby: 40,
  Rust: 46,
  Swift: 44,
  Kotlin: 44,
  Dart: 44,
  Scala: 46,
  Shell: 28,
  HTML: 55,
  CSS: 52,
  SCSS: 52,
  Vue: 48,
  Svelte: 48,
  Elixir: 40,
  Haskell: 46,
  Lua: 36,
  "Objective-C": 46,
  R: 42,
  JSON: 90,
  YAML: 80,
  Markdown: 70,
};

function bytesPerLineForLanguage(name: string): number {
  return BYTES_PER_LINE_BY_LANGUAGE[name] || AVERAGE_BYTES_PER_LINE;
}

function getGithubHeaders() {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "github-language-stats-card",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (process.env.GITHUB_TOKEN) headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchUserRepos(username: string): Promise<Array<{ name: string; owner: { login: string }; fork: boolean; archived: boolean }>> {
  const all: Array<{ name: string; owner: { login: string }; fork: boolean; archived: boolean }> = [];
  let page = 1;
  const HARD_CAP = 1000;
  while (true) {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&type=all&sort=updated&page=${page}` as string, {
      headers: getGithubHeaders(),
      next: { revalidate: 3600 }
    });
    if (!res.ok) {
      // Gracefully stop on rate limit or transient errors; return what we have instead of throwing 500
      if (page === 1) {
        try { await res.text(); } catch {}
        break;
      }
      break;
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
    if (all.length >= HARD_CAP) break;
    page += 1;
  }
  return all.filter((r) => !r.fork && !r.archived);
}

export async function fetchRepoLanguages(owner: string, repo: string): Promise<LanguageStat[]> {
  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages` as string, {
    headers: getGithubHeaders(),
    next: { revalidate: 3600 }
  });
  if (!res.ok) return [];
  const json = await res.json();
  return Object.entries(json || {}).map(([name, bytes]) => ({ name, bytes: Number(bytes) || 0 }));
}

async function fetchStatsWithRetry(url: string, tries = 3): Promise<Response | null> {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url as string, { headers: getGithubHeaders(), next: { revalidate: 3600 } });
    // GitHub may return 202 while generating statistics; retry a few times
    if (res.status !== 202) return res;
    await sleep(1000 * (i + 1));
  }
  return null;
}

async function fetchRepoCommittedLocAll(owner: string, repo: string): Promise<number> {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/stats/code_frequency`;
  const res = await fetchStatsWithRetry(url, 3);
  if (!res || !res.ok) return 0;
  const data = await res.json();
  if (!Array.isArray(data)) return 0;
  let added = 0;
  for (const row of data) {
    if (Array.isArray(row) && typeof row[1] === "number") added += row[1];
  }
  return added;
}

async function fetchRepoCommittedLocByUser(owner: string, repo: string, username: string): Promise<number> {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/stats/contributors`;
  const res = await fetchStatsWithRetry(url, 3);
  if (!res || !res.ok) return 0;
  const data = await res.json();
  if (!Array.isArray(data)) return 0;
  const entry = data.find((c: any) => c?.author?.login?.toLowerCase?.() === username.toLowerCase());
  if (!entry || !Array.isArray(entry?.weeks)) return 0;
  let added = 0;
  for (const w of entry.weeks) {
    if (typeof w?.a === "number") added += w.a;
  }
  return added;
}

export async function aggregateUserLanguages(username: string): Promise<{
  languages: AggregatedLanguage[];
  totalEstimatedLines: number;
  totalCommittedLinesAll: number;
  totalCommittedLinesUser: number;
  repoCount: number;
}> {
  const repos = await fetchUserRepos(username);
  // Tighter limits to avoid function timeouts
  const MAX_REPOS = 40;
  const limited = repos.slice(0, MAX_REPOS);

  const allLangs: Record<string, number> = {};
  const committedAllByLang: Record<string, number> = {};
  const committedUserByLang: Record<string, number> = {};

  const repoLangs: Record<string, { total: number; langs: Record<string, number> }> = {};
  const chunkSize = 8;
  for (let i = 0; i < limited.length; i += chunkSize) {
    const chunk = limited.slice(i, i + chunkSize);
    const results = await Promise.allSettled(chunk.map((r) => fetchRepoLanguages(r.owner.login, r.name)));
    results.forEach((res, idx) => {
      const repo = chunk[idx];
      if (res.status === "fulfilled") {
        let total = 0;
        const map: Record<string, number> = {};
        for (const l of res.value) {
          map[l.name] = (map[l.name] || 0) + l.bytes;
          total += l.bytes;
          allLangs[l.name] = (allLangs[l.name] || 0) + l.bytes;
        }
        repoLangs[`${repo.owner.login}/${repo.name}`] = { total, langs: map };
      }
    });
    await sleep(80);
  }

  let totalCommittedLinesAll = 0;
  let totalCommittedLinesUser = 0;
  for (let i = 0; i < limited.length; i += chunkSize) {
    const chunk = limited.slice(i, i + chunkSize);
    const [allRes, userRes] = await Promise.all([
      Promise.allSettled(chunk.map((r) => fetchRepoCommittedLocAll(r.owner.login, r.name))),
      Promise.allSettled(chunk.map((r) => fetchRepoCommittedLocByUser(r.owner.login, r.name, username)))
    ]);
    for (let idx = 0; idx < chunk.length; idx++) {
      const repo = chunk[idx];
      const repoKey = `${repo.owner.login}/${repo.name}`;
      const dist = repoLangs[repoKey];

      let additionsAll = 0;
      const allItem = allRes[idx];
      if (allItem && allItem.status === "fulfilled") additionsAll = allItem.value;

      let additionsUser = 0;
      const userItem = userRes[idx];
      if (userItem && userItem.status === "fulfilled") additionsUser = userItem.value;

      totalCommittedLinesAll += additionsAll;
      totalCommittedLinesUser += additionsUser;

      if (dist && dist.total > 0) {
        for (const [lang, bytes] of Object.entries(dist.langs)) {
          const weight = bytes / dist.total;
          committedAllByLang[lang] = (committedAllByLang[lang] || 0) + additionsAll * weight;
          committedUserByLang[lang] = (committedUserByLang[lang] || 0) + additionsUser * weight;
        }
      }
    }
    await sleep(80);
  }

  const totalBytes = Object.values(allLangs).reduce((a, b) => a + b, 0);
  const languages: AggregatedLanguage[] = Object.entries(allLangs)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percent: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
      estimatedLines: Math.round(bytes / bytesPerLineForLanguage(name)),
      committedAllLines: Math.round(committedAllByLang[name] || 0),
      committedUserLines: Math.round(committedUserByLang[name] || 0)
    }))
    .sort((a, b) => b.bytes - a.bytes);

  const totalEstimatedLines = languages.reduce((sum, l) => sum + l.estimatedLines, 0);

  return { languages, totalEstimatedLines, totalCommittedLinesAll, totalCommittedLinesUser, repoCount: limited.length };
}

export async function fetchUserProfile(username: string): Promise<{ name: string | null; login: string; avatar_url?: string } | null> {
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}` as string, {
    headers: getGithubHeaders(),
    next: { revalidate: 3600 }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { name: data?.name ?? null, login: data?.login ?? username, avatar_url: data?.avatar_url };
}

export async function fetchWakaTimeHoursFromShare(username: string, shareId: string): Promise<number | null> {
  try {
    const url = `https://wakatime.com/share/@${encodeURIComponent(username)}/${encodeURIComponent(shareId)}.json`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    // The share JSON format varies by chart type; try common shapes
    // 1) Summaries style: data.data -> array of { grand_total: { total_seconds } }
    if (Array.isArray(data?.data)) {
      let totalSeconds = 0;
      for (const d of data.data) {
        const seconds = d?.grand_total?.total_seconds ?? d?.gran_total?.total_seconds; // tolerate typos in some exports
        if (typeof seconds === "number") totalSeconds += seconds;
      }
      if (totalSeconds > 0) return totalSeconds / 3600;
    }
    // 2) Datasets style: data.datasets[].data[] seconds per day
    if (Array.isArray(data?.datasets)) {
      let totalSeconds = 0;
      for (const ds of data.datasets) {
        if (Array.isArray(ds?.data)) {
          for (const v of ds.data) totalSeconds += Number(v) || 0;
        }
      }
      if (totalSeconds > 0) return totalSeconds / 3600;
    }
    return null;
  } catch {
    return null;
  }
}
