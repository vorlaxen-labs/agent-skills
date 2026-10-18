import { Command } from "commander";
import { registerSharedInstallFlags } from "../core/cli-options.js";
import type { ConflictStrategy } from "../conflict/types.js";
import { readInstallManifest } from "../install/manifest.js";
import { runInstall } from "../install/run.js";
import {
  platformLabel,
  printInitResult,
  setOutputOptions,
} from "../core/output.js";

export interface UpdateOptions {
  cwd?: string;
  remote?: boolean | string;
  yes?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  json?: boolean;
  onConflict?: ConflictStrategy;
  appendOrder?: "existing-first" | "vorlaxen-first";
  noCache?: boolean;
  conflictOverrides?: Record<string, ConflictStrategy>;
}

export async function runUpdate(options: UpdateOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  setOutputOptions({
    verbose: options.verbose ?? false,
    json: options.json ?? false,
  });

  const manifest = await readInstallManifest(cwd);
  const remote =
    options.remote !== undefined ? options.remote : manifest.remote ?? undefined;

  const installResult = await runInstall({
    cwd,
    platform: manifest.platform,
    skillIds: manifest.skills,
    remote,
    dryRun: options.dryRun,
    onConflict: options.onConflict,
    appendOrder: options.appendOrder,
    yes: options.yes ?? true,
    nonInteractive: true,
    manifestPolicy: manifest.conflictPolicy,
    conflictOverrides: options.conflictOverrides,
    noCache: options.noCache,
    showFetchMessage: false,
  });

  printInitResult({
    platform: installResult.platform,
    platformLabel: platformLabel(installResult.platform),
    result: installResult.result,
    conflictPolicy: installResult.conflictPolicy,
    dryRun: options.dryRun ?? false,
    manifestPath: installResult.manifestPath,
  });
}

export function registerUpdateCommand(program: Command): void {
  const cmd = program
    .command("update")
    .description("Update installed skills from manifest configuration")
    .option(
      "-r, --remote [ref]",
      "Override remote source (default: from manifest or bundled snapshot)",
    )
    .option("-y, --yes", "Non-interactive (default: true for update)", true);

  registerSharedInstallFlags(cmd);

  cmd.action(async (opts) => {
    let remote: boolean | string | undefined;
    if (opts.remote !== undefined) {
      remote = opts.remote === true ? true : opts.remote;
    }

    await runUpdate({
      cwd: opts.cwd,
      remote,
      yes: opts.yes,
      dryRun: opts.dryRun,
      verbose: opts.verbose,
      json: opts.json,
      onConflict: opts.onConflict,
      appendOrder: opts.appendOrder,
      noCache: opts.noCache,
      conflictOverrides: opts.onConflictFor,
    });
  });
}
