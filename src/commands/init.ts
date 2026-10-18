import { checkbox, select } from "@inquirer/prompts";
import { Command, InvalidArgumentError } from "commander";
import { PLATFORMS, SKILLS, type Platform } from "../core/bundled-catalog.js";
import {
  parseAppendOrder,
  parseConflictStrategy,
  registerSharedInstallFlags,
} from "../core/cli-options.js";
import { runInstall } from "../install/run.js";
import {
  platformLabel,
  printInitResult,
  setOutputOptions,
} from "../core/output.js";
import {
  parsePlatform,
  parseSkillIds,
  ValidationError,
} from "../core/validate.js";

export interface InitOptions {
  cwd?: string;
  platform?: string;
  skills?: string[];
  remote?: boolean | string;
  yes?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  json?: boolean;
  onConflict?: ReturnType<typeof parseConflictStrategy>;
  appendOrder?: ReturnType<typeof parseAppendOrder>;
  noCache?: boolean;
  conflictOverrides?: Record<string, import("../conflict/types.js").ConflictStrategy>;
}

const platformIds = PLATFORMS.map((p) => p.id).join(", ");
const skillIds = SKILLS.map((s) => s.id).join(", ");

export async function runInit(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const output = setOutputOptions({
    verbose: options.verbose ?? false,
    json: options.json ?? false,
  });

  const platform: Platform = options.platform
    ? parsePlatform(options.platform)
    : options.yes
      ? "agents-md"
      : await select<Platform>({
          message: "Platform",
          choices: PLATFORMS.map((p) => ({ name: p.label, value: p.id })),
          default: "agents-md",
        });

  const defaultIds = SKILLS.filter((s) => s.defaultSelected).map((s) => s.id);
  const selectedIds: string[] = options.skills
    ? parseSkillIds(options.skills)
    : options.yes
      ? defaultIds
      : await checkbox<string>({
          message: "Skills",
          choices: SKILLS.map((s) => ({
            name: `${s.label} [${s.category}]`,
            value: s.id,
            checked: s.defaultSelected,
          })),
        });

  if (selectedIds.length === 0) {
    throw new Error("No skills selected. Aborting.");
  }

  if (!selectedIds.includes("global") && !output.json) {
    console.warn(
      "Warning: Global skill not selected — standards may be incomplete.",
    );
  }

  const installResult = await runInstall({
    cwd,
    platform,
    skillIds: selectedIds,
    remote: options.remote,
    dryRun: options.dryRun,
    onConflict: options.onConflict,
    appendOrder: options.appendOrder,
    yes: options.yes,
    yesConflictDefault: "append",
    noCache: options.noCache,
    conflictOverrides: options.conflictOverrides,
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

export function registerInitCommand(program: Command): void {
  const cmd = program
    .command("init")
    .description("Interactive setup — pick platform and skills")
    .option(
      "-p, --platform <platform>",
      `Platform (${platformIds})`,
      (value: string) => {
        try {
          return parsePlatform(value);
        } catch (err) {
          throw new InvalidArgumentError(
            err instanceof ValidationError ? err.message : String(err),
          );
        }
      },
    )
    .option(
      "-s, --skills <ids>",
      `Comma-separated skill ids (${skillIds})`,
      (value: string) => {
        try {
          return parseSkillIds(value.split(","));
        } catch (err) {
          throw new InvalidArgumentError(
            err instanceof ValidationError ? err.message : String(err),
          );
        }
      },
    )
    .option(
      "-r, --remote [ref]",
      "Fetch from GitHub: omit ref for package version tag, or pass e.g. main for latest",
    )
    .option("-y, --yes", "Skip prompts; use defaults (AGENTS.md platform defaults)");

  registerSharedInstallFlags(cmd);

  cmd.action(async (opts) => {
    let remote: boolean | string | undefined;
    if (opts.remote !== undefined) {
      remote = opts.remote === true ? true : opts.remote;
    }

    await runInit({
      cwd: opts.cwd,
      platform: opts.platform,
      skills: opts.skills,
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
