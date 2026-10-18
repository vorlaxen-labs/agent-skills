import type { Command } from "commander";

export interface HubScopeOptions {
  cwd: string;
  project: boolean;
  json: boolean;
  verbose: boolean;
  noCache: boolean;
}

export function registerHubScopeFlags(cmd: Command): void {
  cmd
    .option("-C, --cwd <dir>", "Working directory", process.cwd())
    .option("--project", "Use project agent-skills-hubs.json instead of user config")
    .option("--json", "Machine-readable output")
    .option("--verbose", "Verbose logging")
    .option("--no-cache", "Bypass GitHub response cache");
}

export function readHubScopeOpts(opts: {
  cwd?: string;
  project?: boolean;
  json?: boolean;
  verbose?: boolean;
  noCache?: boolean;
}): HubScopeOptions {
  return {
    cwd: opts.cwd ?? process.cwd(),
    project: opts.project ?? false,
    json: opts.json ?? false,
    verbose: opts.verbose ?? false,
    noCache: opts.noCache ?? false,
  };
}
