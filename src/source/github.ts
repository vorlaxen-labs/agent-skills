import { GITHUB } from "../core/bundled-catalog.js";
import { readCache, writeCache } from "./cache.js";
import type { RemoteFile, SkillSource } from "./types.js";

interface GitHubContent {
  type: "file" | "dir";
  path: string;
}

export interface GitHubSourceOptions {
  noCache?: boolean;
}

const RETRYABLE = new Set([429, 500, 502, 503]);
const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000];

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "vorlaxen-agent-skills-cli",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function rawHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "vorlaxen-agent-skills-cli",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function fetchWithRetry(url: string, headers: Record<string, string>): Promise<Response> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok || !RETRYABLE.has(res.status) || attempt === MAX_RETRIES) {
      if (res.status === 403) {
        throw new Error(
          "GitHub API rate limit or forbidden (403). Set GITHUB_TOKEN for higher rate limits.",
        );
      }
      return res;
    }
    lastError = new Error(`GitHub request failed (${res.status})`);
    await sleep(BACKOFF_MS[attempt] ?? 4000);
  }
  throw lastError ?? new Error("GitHub request failed");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createGitHubSource(
  owner: string = GITHUB.owner,
  repo: string = GITHUB.repo,
  ref: string = GITHUB.branch,
  options: GitHubSourceOptions = {},
): SkillSource {
  const { noCache = false } = options;
  return {
    async fetch(paths: string[]): Promise<RemoteFile[]> {
      const files: RemoteFile[] = [];
      for (const relPath of paths) {
        await fetchPath(owner, repo, ref, relPath, files, noCache);
      }
      return files;
    },
  };
}

async function fetchPath(
  owner: string,
  repo: string,
  ref: string,
  relPath: string,
  files: RemoteFile[],
  noCache: boolean,
): Promise<void> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${relPath}?ref=${ref}`;
  const res = await fetchWithRetry(url, githubHeaders());

  if (res.status === 404) {
    throw new Error(`Skill path not found on GitHub: ${relPath}`);
  }
  if (!res.ok) {
    throw new Error(
      `GitHub API error (${res.status}) for ${relPath}: ${await res.text()}`,
    );
  }

  const data = (await res.json()) as GitHubContent | GitHubContent[];

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.type === "file") {
        await fetchFileRaw(owner, repo, ref, item.path, files, noCache);
      } else if (item.type === "dir") {
        await fetchPath(owner, repo, ref, item.path, files, noCache);
      }
    }
    return;
  }

  if (data.type === "file") {
    await fetchFileRaw(owner, repo, ref, data.path, files, noCache);
  } else if (data.type === "dir") {
    await fetchPath(owner, repo, ref, data.path, files, noCache);
  }
}

async function fetchFileRaw(
  owner: string,
  repo: string,
  ref: string,
  relPath: string,
  files: RemoteFile[],
  noCache: boolean,
): Promise<void> {
  if (!noCache) {
    const cached = await readCache(owner, repo, ref, relPath);
    if (cached !== null) {
      files.push({ relativePath: relPath, content: cached });
      return;
    }
  }

  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${relPath}`;
  const res = await fetchWithRetry(url, rawHeaders());
  if (!res.ok) {
    throw new Error(`Failed to fetch ${relPath}: ${res.status}`);
  }
  const content = await res.text();
  if (!noCache) {
    await writeCache(owner, repo, ref, relPath, content);
  }
  files.push({ relativePath: relPath, content });
}
