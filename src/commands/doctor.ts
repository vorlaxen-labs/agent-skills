import { Command } from "commander";
import { pathExists } from "../core/fs.js";
import {
  getManifestPath,
  ManifestError,
  readInstallManifest,
} from "../install/manifest.js";
import { runDoctorChecks } from "../doctor/checks.js";
import { runDoctorFix } from "../doctor/fix.js";
import { printDoctorResult, setOutputOptions } from "../core/output.js";

export interface DoctorOptions {
  cwd?: string;
  verbose?: boolean;
  json?: boolean;
  strict?: boolean;
  fix?: boolean;
  fixUpdate?: boolean;
  dryRun?: boolean;
  force?: boolean;
  noCache?: boolean;
}

export async function runDoctor(options: DoctorOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  setOutputOptions({ verbose: options.verbose ?? false, json: options.json ?? false });

  const manifestPath = getManifestPath(cwd);
  if (!(await pathExists(manifestPath))) {
    printDoctorResult({ manifestFound: false, checks: [] });
    return 1;
  }

  let manifest;
  try {
    manifest = await readInstallManifest(cwd);
  } catch (err) {
    if (err instanceof ManifestError) {
      printDoctorResult({
        manifestFound: false,
        checks: [{ name: "manifest", status: "error", message: err.message }],
      });
      return 1;
    }
    throw err;
  }

  let checks = await runDoctorChecks({ cwd, manifest, noCache: options.noCache });

  if (options.fix || options.fixUpdate) {
    const fixResult = await runDoctorFix({
      cwd,
      manifest,
      dryRun: options.dryRun,
      force: options.force,
      fixUpdate: options.fixUpdate,
      noCache: options.noCache,
    });
    if (!options.json && fixResult.fixed.length > 0) {
      const verb = options.dryRun ? "Would fix" : "Fixed";
      console.log(`\n${verb} ${fixResult.fixed.length} file(s):\n`);
      for (const f of fixResult.fixed) console.log(`  ✓ ${f}`);
      console.log("");
    }
    if (!options.dryRun) {
      manifest = await readInstallManifest(cwd);
      checks = await runDoctorChecks({ cwd, manifest, noCache: options.noCache });
    }
  }

  printDoctorResult({ manifestFound: true, checks, manifestPath });

  const hasError = checks.some((c) => c.status === "error");
  const hasWarn = checks.some((c) => c.status === "warn");
  if (hasError) return 1;
  if (options.strict && hasWarn) return 1;
  return 0;
}

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Check installed agent skills health")
    .option("-C, --cwd <dir>", "Target project directory", process.cwd())
    .option("--verbose", "Verbose logging")
    .option("--json", "Machine-readable output")
    .option("--strict", "Treat warnings as errors (exit 1)")
    .option("--fix", "Repair missing or drifted files from snapshot")
    .option("--fix-update", "Run update to refresh from upstream")
    .option("--force", "Fix files even without watermark")
    .option("--dry-run", "Preview fix actions")
    .option("--no-cache", "Bypass GitHub response cache")
    .action(async (opts) => {
      const code = await runDoctor({
        cwd: opts.cwd,
        verbose: opts.verbose,
        json: opts.json,
        strict: opts.strict,
        fix: opts.fix,
        fixUpdate: opts.fixUpdate,
        dryRun: opts.dryRun,
        force: opts.force,
        noCache: opts.noCache,
      });
      if (code !== 0) process.exitCode = code;
    });
}
