import { deleteFile, pathExists, readTextFile } from "../core/fs.js";
import { WATERMARK } from "../core/markdown.js";

export interface RemovePathsOptions {
  force?: boolean;
  dryRun?: boolean;
}

export interface RemovePathsResult {
  removed: string[];
  skipped: string[];
}

export async function removePaths(
  paths: string[],
  options: RemovePathsOptions = {},
): Promise<RemovePathsResult> {
  const removed: string[] = [];
  const skipped: string[] = [];

  for (const file of paths) {
    if (!(await pathExists(file))) {
      skipped.push(file);
      continue;
    }

    if (!options.force) {
      const content = await readTextFile(file);
      if (!content.includes(WATERMARK)) {
        skipped.push(file);
        continue;
      }
    }

    if (options.dryRun) {
      removed.push(file);
      continue;
    }

    await deleteFile(file);
    removed.push(file);
  }

  return { removed, skipped };
}
