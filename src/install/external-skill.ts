import { mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { discoverSkillsFromFileList, type DiscoveredSkill } from "../discovery/discover.js";
import { pathExists, projectPath, writeTextFile } from "../core/fs.js";
import {
  hashSkillFolder,
  mergeLockEntry,
  readSkillsLock,
  removeLockSkills,
  writeSkillsLock,
  type SkillLockEntry,
  type SkillsLockFile,
} from "../lock/skills-lock.js";
import { withWatermark } from "../core/markdown.js";
import type { Platform } from "../core/bundled-catalog.js";
import { readInstallManifest } from "./manifest.js";
import { parseSource } from "../source/parse-source.js";
import { stageSourceFiles } from "../source/stage-files.js";
import { getHubSubscription } from "../hub/config.js";
import { loadHubCatalog } from "../hub/catalog.js";
import { resolveHubSkillInstall } from "../hub/resolve-skill.js";

export interface InstallExternalOptions {
  cwd: string;
  source: string;
  skillNames?: string[];
  ref?: string;
  dryRun?: boolean;
  noCache?: boolean;
  force?: boolean;
}

export interface InstallExternalResult {
  installed: string[];
  skipped: string[];
  lockPath?: string;
}

export async function installExternalSkills(
  options: InstallExternalOptions,
): Promise<InstallExternalResult> {
  const { cwd, source, skillNames, dryRun, noCache, force } = options;
  const parsed = parseSource(source, options.ref ?? "main");

  if (parsed.type === "hub") {
    return installExternalSkillsFromHub(options, parsed.hubId);
  }

  const staged = await stageSourceFiles(parsed, { cwd, noCache });

  const discovered = discoverSkillsFromFileList(staged.files);
  if (discovered.length === 0) {
    throw new Error(`No skills (SKILL.md) found in source "${source}".`);
  }

  let selected = discovered;
  if (skillNames && skillNames.length > 0) {
    const want = new Set(skillNames);
    selected = discovered.filter((s) => want.has(s.name));
    const missing = skillNames.filter((n) => !selected.some((s) => s.name === n));
    if (missing.length > 0) {
      throw new Error(
        `Skill(s) not found in source: ${missing.join(", ")}. Available: ${discovered.map((s) => s.name).join(", ")}`,
      );
    }
  }

  const lock = await readSkillsLock(cwd);
  const installed: string[] = [];
  const skipped: string[] = [];

  let platform: Platform | null = null;
  if (await pathExists(projectPath(cwd, ".agent-skills", "manifest.json"))) {
    try {
      const manifest = await readInstallManifest(cwd);
      platform = manifest.platform;
    } catch {
      platform = null;
    }
  }

  let nextLock: SkillsLockFile = lock;

  for (const skill of selected) {
    if (lock.skills[skill.name] && !dryRun && !force) {
      skipped.push(skill.name);
      continue;
    }

    if (!dryRun) {
      await materializeSkill(cwd, skill, platform);
      const entry: SkillLockEntry = {
        source: staged.lockSource,
        sourceType: staged.sourceType,
        skillPath: skill.skillPath,
        computedHash: hashSkillFolder(skill.files),
        ref: staged.ref,
      };
      nextLock = mergeLockEntry(nextLock, skill.name, entry);
    }
    installed.push(skill.name);
  }

  let lockPath: string | undefined;
  if (!dryRun && installed.length > 0) {
    lockPath = await writeSkillsLock(cwd, nextLock);
  }

  return { installed, skipped, lockPath };
}

async function installExternalSkillsFromHub(
  options: InstallExternalOptions,
  hubId: string,
): Promise<InstallExternalResult> {
  const aliases = options.skillNames;
  if (!aliases || aliases.length === 0) {
    throw new Error(`Hub source requires skill alias(es): add hub:${hubId} -s <alias>`);
  }

  const sub = await getHubSubscription(options.cwd, hubId);
  if (!sub) {
    throw new Error(
      `Hub "${hubId}" is not subscribed. Run: agent-skills hub add ${hubId}`,
    );
  }

  const { catalog } = await loadHubCatalog({
    subscription: sub,
    cwd: options.cwd,
    noCache: options.noCache,
  });

  const installed: string[] = [];
  const skipped: string[] = [];
  let lockPath: string | undefined;

  for (const alias of aliases) {
    const entry = catalog.skills[alias];
    if (!entry) {
      throw new Error(
        `Skill alias "${alias}" not found in hub "${hubId}". Available: ${Object.keys(catalog.skills).join(", ") || "(none)"}`,
      );
    }
    const resolved = await resolveHubSkillInstall({
      cwd: options.cwd,
      alias,
      entry,
      subscription: sub,
      refOverride: options.ref ?? entry.ref ?? sub.ref,
      noCache: options.noCache,
    });

    const result = await installExternalSkills({
      cwd: options.cwd,
      source: resolved.source,
      skillNames: [resolved.skillName],
      ref: resolved.ref,
      dryRun: options.dryRun,
      noCache: options.noCache,
      force: options.force,
    });
    installed.push(...result.installed);
    skipped.push(...result.skipped);
    if (result.lockPath) lockPath = result.lockPath;
  }

  return { installed, skipped, lockPath };
}

async function materializeSkill(
  cwd: string,
  skill: DiscoveredSkill,
  platform: Platform | null,
): Promise<void> {
  const agentsDir = projectPath(cwd, ".agents", "skills", skill.name);
  await rm(agentsDir, { recursive: true, force: true });
  await writeSkillTree(agentsDir, skill.files);

  if (platform === "cursor") {
    const cursorDir = projectPath(cwd, ".cursor", "skills", skill.name);
    await rm(cursorDir, { recursive: true, force: true });
    await writeSkillTree(cursorDir, skill.files);
  }
}

async function writeSkillTree(
  destRoot: string,
  files: Map<string, string>,
): Promise<void> {
  for (const [rel, content] of files) {
    const dest = join(destRoot, rel);
    await mkdir(dirname(dest), { recursive: true });
    const out = rel.endsWith(".md") || rel.endsWith(".mdc") ? withWatermark(content) : content;
    await writeTextFile(dest, out);
  }
}

export async function removeExternalSkills(
  cwd: string,
  names: string[],
  dryRun?: boolean,
): Promise<string[]> {
  const lock = await readSkillsLock(cwd);
  const removed: string[] = [];
  for (const name of names) {
    if (!lock.skills[name]) continue;
    if (!dryRun) {
      await rm(projectPath(cwd, ".agents", "skills", name), { recursive: true, force: true });
      await rm(projectPath(cwd, ".cursor", "skills", name), { recursive: true, force: true });
    }
    removed.push(name);
  }
  if (!dryRun && removed.length > 0) {
    await writeSkillsLock(cwd, removeLockSkills(lock, removed));
  }
  return removed;
}
