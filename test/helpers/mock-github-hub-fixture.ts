import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

interface GitHubContentItem {
  type: "file" | "dir";
  path: string;
}

async function listGitHubContents(
  fixtureRoot: string,
  relPath: string,
): Promise<GitHubContentItem[]> {
  const abs = join(fixtureRoot, relPath);
  const entries = await readdir(abs, { withFileTypes: true });
  return entries.map((entry) => ({
    type: entry.isDirectory() ? "dir" : "file",
    path: relPath ? `${relPath}/${entry.name}` : entry.name,
  }));
}

/**
 * Mock GitHub Contents + raw URLs so hub install tests never hit the network.
 */
export function mockGithubHubFixture(options: {
  fixtureRoot: string;
  owner: string;
  repo: string;
  ref: string;
}): () => void {
  const { fixtureRoot, owner, repo, ref } = options;
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const contentsPrefix = `https://api.github.com/repos/${owner}/${repo}/contents/`;
    if (url.startsWith(contentsPrefix)) {
      const after = url.slice(contentsPrefix.length);
      const relPath = decodeURIComponent(after.split("?")[0] ?? "");
      const abs = join(fixtureRoot, relPath);
      try {
        const info = await stat(abs);
        if (info.isFile()) {
          return Response.json({ type: "file", path: relPath } satisfies GitHubContentItem);
        }
        if (info.isDirectory()) {
          const items = await listGitHubContents(fixtureRoot, relPath);
          return Response.json(items);
        }
      } catch {
        return new Response("not found", { status: 404 });
      }
    }

    const rawPrefix = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/`;
    if (url.startsWith(rawPrefix)) {
      const relPath = decodeURIComponent(url.slice(rawPrefix.length));
      try {
        const content = await readFile(join(fixtureRoot, relPath), "utf8");
        return new Response(content, { status: 200 });
      } catch {
        return new Response("not found", { status: 404 });
      }
    }

    return originalFetch(input, init);
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}
