import { compareContent, unifiedDiff, type FileDiff } from "../diff/unified.js";
import type { PlannedWrite } from "../install/planned.js";
import { pathExists, readTextFile } from "../core/fs.js";
import { stripWatermark } from "../core/markdown.js";

export function normalizeIncoming(content: string): string {
  return stripWatermark(content).trim();
}

export async function comparePlannedToDisk(
  planned: PlannedWrite[],
): Promise<FileDiff[]> {
  const files: FileDiff[] = [];

  for (const write of planned) {
    const incoming = normalizeIncoming(write.content);
    const exists = await pathExists(write.dest);

    if (!exists) {
      files.push({
        dest: write.dest,
        status: "create",
        diff: unifiedDiff("/dev/null", write.dest, "", incoming),
      });
      continue;
    }

    const existing = normalizeIncoming(await readTextFile(write.dest));
    const status = compareContent(existing, incoming);
    files.push({
      dest: write.dest,
      status: status === "unchanged" ? "unchanged" : "modify",
      diff:
        status === "modify"
          ? unifiedDiff(write.dest, write.dest, existing, incoming)
          : undefined,
    });
  }

  return files;
}

export function summarizeDiff(files: FileDiff[]): {
  unchanged: number;
  modify: number;
  create: number;
} {
  return {
    unchanged: files.filter((f) => f.status === "unchanged").length,
    modify: files.filter((f) => f.status === "modify").length,
    create: files.filter((f) => f.status === "create").length,
  };
}

export function hasDrift(files: FileDiff[]): boolean {
  return files.some((f) => f.status === "modify" || f.status === "create");
}
