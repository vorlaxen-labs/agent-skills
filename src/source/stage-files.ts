import { resolve } from "node:path";
import { createGitHubSource } from "./github.js";
import { createLocalSource } from "./local.js";
import { formatGithubSource, type ParsedSource } from "./parse-source.js";
import type { RemoteFile } from "./types.js";
import type { SkillLockEntry } from "../lock/skills-lock.js";

export async function stageSourceFiles(
  parsed: ParsedSource,
  options: { cwd: string; noCache?: boolean },
): Promise<{ files: RemoteFile[]; lockSource: string; sourceType: SkillLockEntry["sourceType"]; ref?: string }> {
  if (parsed.type === "hub") {
    throw new Error("Hub sources must be resolved before staging files.");
  }
  if (parsed.type === "local") {
    const abs = resolve(options.cwd, parsed.path);
    const source = createLocalSource(abs);
    const files = await source.fetch([]);
    return { files, lockSource: parsed.path, sourceType: "local" };
  }

  const source = createGitHubSource(parsed.owner, parsed.repo, parsed.ref, {
    noCache: options.noCache,
  });
  const roots = parsed.subpath ? [parsed.subpath] : ["skills", ".agents/skills", ""];
  let files: RemoteFile[] = [];
  for (const root of roots) {
    try {
      files = await source.fetch(root ? [root] : ["."]);
      if (files.some((f) => f.relativePath.endsWith("SKILL.md"))) {
        break;
      }
    } catch {
      continue;
    }
  }
  if (files.length === 0) {
    throw new Error(`No files found in ${parsed.owner}/${parsed.repo}@${parsed.ref}`);
  }
  return {
    files,
    lockSource: formatGithubSource(parsed.owner, parsed.repo),
    sourceType: "github",
    ref: parsed.ref,
  };
}
