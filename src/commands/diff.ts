import { Command } from "commander";
import { hasDrift } from "../install/compare-snapshot.js";
import { comparePlannedToDisk } from "../install/compare-snapshot.js";
import { ManifestError, readInstallManifest } from "../install/manifest.js";
import { planFromManifest } from "../install/run.js";
import { logVerbose, printDiffResult, setOutputOptions } from "../core/output.js";

export interface DiffOptions {
  cwd?: string;
  verbose?: boolean;
  json?: boolean;
  noCache?: boolean;
  /** Exit 1 when any file would change (CI-friendly) */
  check?: boolean;
}

export async function runDiff(options: DiffOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  setOutputOptions({
    verbose: options.verbose ?? false,
    json: options.json ?? false,
  });

  let manifest;
  try {
    manifest = await readInstallManifest(cwd);
  } catch (err) {
    if (err instanceof ManifestError) {
      if (options.json) {
        console.log(JSON.stringify({ error: err.message }, null, 2));
      } else {
        console.error(err.message);
      }
      return 1;
    }
    throw err;
  }

  logVerbose(`Planning diff for platform ${manifest.platform}`);

  const { planned } = await planFromManifest(cwd, manifest, options.noCache);
  const files = await comparePlannedToDisk(planned);

  printDiffResult({ files });

  if (options.check && hasDrift(files)) {
    return 1;
  }
  return 0;
}

export function registerDiffCommand(program: Command): void {
  program
    .command("diff")
    .description("Show differences between installed files and latest snapshot")
    .option("-C, --cwd <dir>", "Target project directory", process.cwd())
    .option("--verbose", "Verbose logging")
    .option("--json", "Machine-readable output")
    .option("--no-cache", "Bypass GitHub response cache")
    .option("--check", "Exit 1 if any file differs from snapshot")
    .action(async (opts) => {
      const code = await runDiff({
        cwd: opts.cwd,
        verbose: opts.verbose,
        json: opts.json,
        noCache: opts.noCache,
        check: opts.check,
      });
      if (code !== 0) process.exitCode = code;
    });
}
