import { Command } from "commander";
import { installExternalSkills } from "../install/external-skill.js";
import { setOutputOptions } from "../core/output.js";

export interface AddOptions {
  cwd?: string;
  source: string;
  skillNames?: string[];
  ref?: string;
  yes?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  json?: boolean;
  noCache?: boolean;
}

export async function runAdd(options: AddOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const output = setOutputOptions({
    verbose: options.verbose ?? false,
    json: options.json ?? false,
  });

  const result = await installExternalSkills({
    cwd,
    source: options.source,
    skillNames: options.skillNames,
    ref: options.ref,
    dryRun: options.dryRun,
    noCache: options.noCache,
  });

  if (output.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (result.installed.length === 0 && result.skipped.length === 0) {
    console.log("\nNo skills installed.\n");
    return;
  }

  if (result.installed.length > 0) {
    console.log(`\nInstalled: ${result.installed.join(", ")}`);
  }
  if (result.skipped.length > 0) {
    console.log(`Already present (skipped): ${result.skipped.join(", ")}`);
  }
  if (result.lockPath) {
    console.log(`Lock: ${result.lockPath}`);
  }
  console.log("");
}

export function registerAddCommand(program: Command): void {
  program
    .command("add")
    .description("Install skills from a GitHub repo or local path into the project")
    .argument("<source>", "owner/repo, hub:<hubId>, GitHub URL, or local path")
    .argument("[skills...]", "Skill name(s) from SKILL.md frontmatter (default: all)")
    .option("-C, --cwd <dir>", "Target project directory", process.cwd())
    .option("-s, --skill <names...>", "Install specific skill(s) by name")
    .option("--ref <git-ref>", "Git ref for GitHub sources (default: main)")
    .option("-y, --yes", "Non-interactive (reserved)")
    .option("--dry-run", "Show planned installs without writing files")
    .option("--verbose", "Verbose logging")
    .option("--json", "Machine-readable output")
    .option("--no-cache", "Bypass GitHub response cache")
    .action(async (source: string, skills: string[], opts) => {
      const skillNames = [...(opts.skill ?? []), ...skills].filter(Boolean);
      await runAdd({
        cwd: opts.cwd,
        source,
        skillNames: skillNames.length > 0 ? skillNames : undefined,
        ref: opts.ref,
        yes: opts.yes,
        dryRun: opts.dryRun,
        verbose: opts.verbose,
        json: opts.json,
        noCache: opts.noCache,
      });
    });
}
