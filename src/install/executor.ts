import type { ConflictPolicyV2 } from "../conflict/types.js";
import { resolveStrategyForPath } from "../conflict/path-policy.js";
import { pathExists, readTextFile, writeTextFile } from "../core/fs.js";
import { withWatermark } from "../core/markdown.js";
import { contentAlreadyPresent, mergeContent } from "./merge.js";
import type { InstallResult, PlannedAction, PlannedWrite } from "./types.js";

export interface ExecuteOptions {
  dryRun?: boolean;
  policy?: ConflictPolicyV2 | null;
  cwd?: string;
}

export async function executePlan(
  planned: PlannedWrite[],
  options: ExecuteOptions = {},
): Promise<InstallResult> {
  const cwd = options.cwd ?? process.cwd();
  const written: string[] = [];
  const skipped: string[] = [];
  const plannedActions: PlannedAction[] = [];

  for (const write of planned) {
    const exists = await pathExists(write.dest);
    const strategy = exists
      ? resolveStrategyForPath(write.dest, cwd, options.policy)
      : "replace";
    const action = resolveAction(exists, strategy);
    plannedActions.push({ dest: write.dest, action });

    if (action === "skip") {
      skipped.push(write.dest);
      continue;
    }

    if (options.dryRun) {
      if (action === "create" || action === "replace" || action === "append") {
        written.push(write.dest);
      }
      continue;
    }

    let finalContent = write.content;

    if (exists && action === "append") {
      const existing = await readTextFile(write.dest);
      if (contentAlreadyPresent(existing, write.content)) {
        skipped.push(write.dest);
        continue;
      }
      const order = options.policy?.appendOrder ?? "vorlaxen-first";
      finalContent = mergeContent(existing, write.content, order);
    }

    await writeTextFile(write.dest, withWatermark(finalContent));
    written.push(write.dest);
  }

  return {
    written,
    skipped,
    planned: options.dryRun ? plannedActions : undefined,
  };
}

function resolveAction(
  exists: boolean,
  strategy: string,
): PlannedAction["action"] {
  if (!exists) {
    return "create";
  }

  switch (strategy) {
    case "skip":
      return "skip";
    case "append":
      return "append";
    case "replace":
    default:
      return "replace";
  }
}
