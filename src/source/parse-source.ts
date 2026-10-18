export type ParsedSource =
  | { type: "local"; path: string }
  | { type: "github"; owner: string; repo: string; ref: string; subpath?: string }
  | { type: "hub"; hubId: string };

const HUB_SOURCE = /^hub:([A-Za-z0-9_.-]+)$/;

const GITHUB_SHORTHAND = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/;
const GITHUB_HTTPS =
  /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?(?:\/tree\/([^/]+)(?:\/(.*))?)?\/?$/;

export function parseSource(input: string, defaultRef = "main"): ParsedSource {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Source is required (e.g. owner/repo or ./path-to-skills).");
  }

  const hub = HUB_SOURCE.exec(trimmed);
  if (hub) {
    return { type: "hub", hubId: hub[1]! };
  }

  if (trimmed.startsWith("./") || trimmed.startsWith("../") || trimmed.startsWith("/")) {
    return { type: "local", path: trimmed };
  }

  const https = GITHUB_HTTPS.exec(trimmed);
  if (https) {
    return {
      type: "github",
      owner: https[1]!,
      repo: https[2]!,
      ref: https[3] ?? defaultRef,
      subpath: https[4]?.replace(/\/$/, "") || undefined,
    };
  }

  const shorthand = GITHUB_SHORTHAND.exec(trimmed);
  if (shorthand) {
    return {
      type: "github",
      owner: shorthand[1]!,
      repo: shorthand[2]!,
      ref: defaultRef,
    };
  }

  throw new Error(
    `Unrecognized source "${trimmed}". Use owner/repo, a GitHub URL, or a local path.`,
  );
}

export function formatGithubSource(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}
