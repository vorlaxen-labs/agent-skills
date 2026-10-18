import { InvalidArgumentError, type Command } from "commander";
import type { AppendOrder, ConflictStrategy } from "../conflict/types.js";

export function parseConflictStrategy(value: string): ConflictStrategy {
  const normalized = value.trim() as ConflictStrategy;
  if (!["replace", "append", "skip", "inherit"].includes(normalized)) {
    throw new InvalidArgumentError(
      `Invalid on-conflict mode "${value}". Use: replace, append, skip, or inherit.`,
    );
  }
  return normalized;
}

export function parseAppendOrder(value: string): AppendOrder {
  const normalized = value.trim() as AppendOrder;
  if (!["existing-first", "vorlaxen-first"].includes(normalized)) {
    throw new InvalidArgumentError(
      `Invalid append-order "${value}". Use: existing-first or vorlaxen-first.`,
    );
  }
  return normalized;
}

export function parseConflictOverride(value: string): Record<string, ConflictStrategy> {
  const sep = value.indexOf("=");
  if (sep === -1) {
    throw new InvalidArgumentError(
      `Invalid on-conflict-for "${value}". Use: <glob>=<mode> (e.g. AGENTS.md=append).`,
    );
  }
  const glob = value.slice(0, sep).trim();
  const mode = parseConflictStrategy(value.slice(sep + 1));
  return { [glob]: mode };
}

export interface SharedCommandFlags {
  cwd?: string;
  dryRun?: boolean;
  verbose?: boolean;
  json?: boolean;
  yes?: boolean;
  onConflict?: ConflictStrategy;
  appendOrder?: AppendOrder;
  noCache?: boolean;
  conflictOverrides?: Record<string, ConflictStrategy>;
}

export function registerSharedInstallFlags(command: Command): void {
  command.option("-C, --cwd <dir>", "Target project directory", process.cwd());
  command.option("--dry-run", "Show planned writes without changing files");
  command.option("--verbose", "Verbose logging");
  command.option("--json", "Machine-readable output");
  command.option(
    "--on-conflict <mode>",
    "Conflict strategy: replace, append, skip, or inherit",
    parseConflictStrategy,
  );
  command.option(
    "--append-order <order>",
    "When appending: existing-first or vorlaxen-first",
    parseAppendOrder,
  );
  command.option(
    "--on-conflict-for <glob=mode>",
    "Per-path conflict override (repeatable)",
    (value: string, prev: Record<string, ConflictStrategy> = {}) => ({
      ...prev,
      ...parseConflictOverride(value),
    }),
  );
  command.option("--no-cache", "Bypass GitHub response cache");
}
