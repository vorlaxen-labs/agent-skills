import { confirm } from "@inquirer/prompts";
import { Command } from "commander";
import { deleteFile, pathExists, removeEmptyDir } from "../core/fs.js";
import { getManifestPath, readInstallManifest } from "../install/manifest.js";
import { removePaths } from "../install/remove.js";
import { printUninstallResult, setOutputOptions } from "../core/output.js";

export interface UninstallOptions {
  cwd?: string;
  yes?: boolean;
  force?: boolean;
  dryRun?: boolean;
  json?: boolean;
  verbose?: boolean;
}

export async function runUninstall(options: UninstallOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  setOutputOptions({
    verbose: options.verbose ?? false,
    json: options.json ?? false,
  });

  const manifest = await readInstallManifest(cwd);

  if (!options.yes && !options.dryRun) {
    const proceed = await confirm({
      message: `Remove ${manifest.written.length} installed file(s)?`,
      default: false,
    });
    if (!proceed) {
      console.log("\nUninstall cancelled.\n");
      return;
    }
  }

  const { removed, skipped } = await removePaths(manifest.written, {
    force: options.force,
    dryRun: options.dryRun,
  });

  if (!options.dryRun) {
    const manifestPath = getManifestPath(cwd);
    if (await pathExists(manifestPath)) {
      await deleteFile(manifestPath);
    }
    await removeEmptyDir(`${cwd}/.agent-skills`);
  }

  printUninstallResult({ removed, skipped, dryRun: options.dryRun ?? false });
}

export function registerUninstallCommand(program: Command): void {
  program
    .command("uninstall")
    .description("Remove installed agent skill files")
    .option("-C, --cwd <dir>", "Target project directory", process.cwd())
    .option("-y, --yes", "Skip confirmation prompt")
    .option("--force", "Remove files even without Vorlaxen watermark")
    .option("--dry-run", "Show what would be removed")
    .option("--json", "Machine-readable output")
    .option("--verbose", "Verbose logging")
    .action(async (opts) => {
      await runUninstall({
        cwd: opts.cwd,
        yes: opts.yes,
        force: opts.force,
        dryRun: opts.dryRun,
        json: opts.json,
        verbose: opts.verbose,
      });
    });
}
