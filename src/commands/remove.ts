import { confirm } from "@inquirer/prompts";
import { Command } from "commander";
import { SKILLS } from "../core/bundled-catalog.js";
import { removeExternalSkills } from "../install/external-skill.js";
import {
  readInstallManifest,
  removeSkillsFromManifest,
  writeInstallManifest,
} from "../install/manifest.js";
import { removePaths } from "../install/remove.js";
import { rebuildAgentRootFile } from "../install/run.js";
import {
  agentRootPath,
  pathsForSkillRemoval,
} from "../install/skill-paths.js";
import { readSkillsLock } from "../lock/skills-lock.js";
import { printUninstallResult, setOutputOptions } from "../core/output.js";
import { parseRemoveSkillIds, SKILL_IDS, ValidationError } from "../core/validate.js";

export interface RemoveOptions {
  cwd?: string;
  skillIds: string[];
  yes?: boolean;
  force?: boolean;
  dryRun?: boolean;
  json?: boolean;
  verbose?: boolean;
}

export async function runRemove(options: RemoveOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  setOutputOptions({
    verbose: options.verbose ?? false,
    json: options.json ?? false,
  });

  const lock = await readSkillsLock(cwd);
  const externalNames = options.skillIds.filter((id) => lock.skills[id]);
  const bundledCandidates = options.skillIds.filter((id) => !lock.skills[id]);

  const removedExternal = externalNames.length
    ? await removeExternalSkills(cwd, externalNames, options.dryRun)
    : [];

  if (bundledCandidates.length === 0) {
    if (removedExternal.length > 0) {
      printUninstallResult({
        removed: removedExternal.map((n) => `.agents/skills/${n}`),
        skipped: [],
        dryRun: options.dryRun ?? false,
      });
    } else {
      console.log("\nNone of the requested skills are installed.\n");
    }
    return;
  }

  let manifest;
  try {
    manifest = await readInstallManifest(cwd);
  } catch {
    if (removedExternal.length > 0) {
      printUninstallResult({
        removed: removedExternal.map((n) => `.agents/skills/${n}`),
        skipped: [],
        dryRun: options.dryRun ?? false,
      });
      return;
    }
    const unknown = bundledCandidates.filter((id) => !SKILL_IDS.includes(id));
    if (unknown.length > 0) {
      const quoted = unknown.map((id) => `"${id}"`).join(", ");
      throw new ValidationError(`Unknown skill${unknown.length > 1 ? "s" : ""} ${quoted}.`);
    }
    console.log("\nNone of the requested skills are installed.\n");
    return;
  }

  const unknown = bundledCandidates.filter(
    (id) => !manifest.skills.includes(id) && !SKILL_IDS.includes(id),
  );
  if (unknown.length > 0) {
    const quoted = unknown.map((id) => `"${id}"`).join(", ");
    throw new ValidationError(
      `Unknown skill${unknown.length > 1 ? "s" : ""} ${quoted}.\nBundled: ${SKILL_IDS.join(", ")}`,
    );
  }
  const skillIds = bundledCandidates.filter((id) => manifest.skills.includes(id));

  if (skillIds.length === 0 && removedExternal.length === 0) {
    console.log("\nNone of the requested skills are installed.\n");
    return;
  }

  const paths = pathsForSkillRemoval(manifest, skillIds);
  const needsAgentRebuild =
    skillIds.some((id) => id !== "global") &&
    (manifest.platform === "agents-md" ||
      manifest.platform === "claude-code" ||
      manifest.platform === "copilot");

  if (skillIds.length > 0 && !options.yes && !options.dryRun) {
    const proceed = await confirm({
      message: `Remove ${skillIds.join(", ")} from installation?`,
      default: false,
    });
    if (!proceed) {
      console.log("\nRemove cancelled.\n");
      return;
    }
  }

  const { removed, skipped } =
    skillIds.length > 0
      ? await removePaths(paths, {
          force: options.force,
          dryRun: options.dryRun,
        })
      : { removed: [] as string[], skipped: [] as string[] };

  if (!options.dryRun && skillIds.length > 0) {
    const updatedManifest = removeSkillsFromManifest(manifest, skillIds, removed);
    await writeInstallManifest(cwd, updatedManifest);

    if (needsAgentRebuild && agentRootPath(cwd, manifest.platform)) {
      const rebuildResult = await rebuildAgentRootFile(cwd, updatedManifest);
      if (rebuildResult.written.length > 0) {
        const next = {
          ...updatedManifest,
          written: [
            ...new Set([
              ...updatedManifest.written.filter(
                (p) => p !== agentRootPath(cwd, manifest.platform),
              ),
              ...rebuildResult.written,
            ]),
          ],
        };
        await writeInstallManifest(cwd, next);
      }
    }
  }

  printUninstallResult({
    removed: [...removedExternal.map((n) => `.agents/skills/${n}`), ...removed],
    skipped,
    dryRun: options.dryRun ?? false,
  });
}

export function registerRemoveCommand(program: Command): void {
  program
    .command("remove")
    .description("Remove bundled standards or integrated skills from the project")
    .argument("<skill-ids...>", "Bundled id (global) or integrated skill name from skills-lock.json")
    .option("-C, --cwd <dir>", "Target project directory", process.cwd())
    .option("-y, --yes", "Skip confirmation prompt")
    .option("--force", "Remove files even without Vorlaxen watermark")
    .option("--dry-run", "Show what would be removed")
    .option("--json", "Machine-readable output")
    .option("--verbose", "Verbose logging")
    .action(async (skillIds: string[], opts) => {
      await runRemove({
        cwd: opts.cwd,
        skillIds: parseRemoveSkillIds(skillIds),
        yes: opts.yes,
        force: opts.force,
        dryRun: opts.dryRun,
        json: opts.json,
        verbose: opts.verbose,
      });
    });
}
