import { posix, resolve } from "node:path";
import { discoverSkillsFromFileList } from "../discovery/discover.js";
import { stageSourceFiles } from "../source/stage-files.js";
import { formatGithubSource, parseSource } from "../source/parse-source.js";
import type { HubSkillEntry, HubSubscription } from "./types.js";

function isRelativeEntrySource(source: string): boolean {
  return source.startsWith("./") || source.startsWith("../");
}

/** Catalog `./…` paths that stay inside the hub repository. */
export function isInsideHubRepoSource(source: string): boolean {
  const trimmed = source.trim();
  if (!trimmed.startsWith("./")) return false;
  const normalized = posix.normalize(trimmed);
  return normalized !== ".." && !normalized.startsWith("../") && !posix.isAbsolute(normalized);
}

function repoRelativeSubpath(base: string | undefined, relativeSource: string): string | undefined {
  const basePath = base?.replace(/\/$/, "") ?? "";
  const joined = basePath ? `${basePath}/${relativeSource}` : relativeSource;
  const normalized = posix.normalize(joined).replace(/\/$/, "");
  if (normalized === ".." || normalized.startsWith("../") || posix.isAbsolute(normalized)) {
    throw new Error(
      `Hub skill source "${relativeSource}" is outside the hub repository.`,
    );
  }
  if (normalized === ".") return undefined;
  return normalized;
}

function githubTreeSource(owner: string, repo: string, ref: string, subpath?: string): string {
  const root = `https://github.com/${owner}/${repo}/tree/${ref}`;
  return subpath ? `${root}/${subpath}` : root;
}

export function resolveEntrySourcePath(
  entrySource: string,
  subscription: HubSubscription,
  cwd: string,
  ref?: string,
): string {
  const trimmed = entrySource.trim();
  if (!isRelativeEntrySource(trimmed)) {
    return trimmed;
  }

  const hubRoot = parseSource(subscription.source, subscription.ref);
  if (hubRoot.type === "local") {
    return resolve(resolve(cwd, hubRoot.path), trimmed);
  }
  if (hubRoot.type === "github") {
    const subpath = repoRelativeSubpath(hubRoot.subpath, trimmed);
    return githubTreeSource(hubRoot.owner, hubRoot.repo, ref ?? subscription.ref, subpath);
  }
  throw new Error(`Cannot resolve skill source "${trimmed}" from hub "${subscription.hubId}".`);
}

export function catalogEntrySkillName(alias: string, entry: HubSkillEntry): string {
  return entry.skill ?? alias;
}

export function normalizeLockSource(source: string): string {
  const trimmed = source.trim();
  try {
    const parsed = parseSource(trimmed);
    if (parsed.type === "github") {
      return formatGithubSource(parsed.owner, parsed.repo);
    }
  } catch {
    // keep as-is for local paths
  }
  return trimmed;
}

export function sourcesMatch(lockSource: string, catalogSource: string): boolean {
  return normalizeLockSource(lockSource) === normalizeLockSource(catalogSource);
}

export async function resolveHubSkillInstall(options: {
  cwd: string;
  alias: string;
  entry: HubSkillEntry;
  subscription: HubSubscription;
  refOverride?: string;
  noCache?: boolean;
}): Promise<{ source: string; ref: string; skillName: string }> {
  const { cwd, alias, entry, subscription, refOverride, noCache } = options;
  const ref = refOverride ?? entry.ref ?? "main";
  const sourcePath = resolveEntrySourcePath(entry.source, subscription, cwd, ref);
  const parsed = parseSource(sourcePath, ref);
  const staged = await stageSourceFiles(parsed, { cwd, noCache });
  const discovered = discoverSkillsFromFileList(staged.files);
  const targetName = catalogEntrySkillName(alias, entry);

  const skill = discovered.find((s) => s.name === targetName);
  if (!skill) {
    throw new Error(
      `Skill "${targetName}" not found in ${entry.source}. Available: ${discovered.map((s) => s.name).join(", ") || "(none)"}`,
    );
  }

  if (!entry.skill && skill.name !== alias) {
    throw new Error(
      `Hub alias '${alias}' ile SKILL.md name '${skill.name}' uyuşmuyor; manifestte skill alanı belirtin.`,
    );
  }

  return {
    source: staged.lockSource,
    ref: staged.ref ?? ref,
    skillName: skill.name,
  };
}
