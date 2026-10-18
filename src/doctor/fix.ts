import { comparePlannedToDisk } from "../install/compare-snapshot.js";
import { readTextFile } from "../core/fs.js";
import type { InstallManifest } from "../install/manifest.js";
import { planFromManifest } from "../install/run.js";
import { WATERMARK } from "../core/markdown.js";
import type { PlannedWrite } from "../install/planned.js";
import { executePlan } from "../install/executor.js";
import { buildContentHashes, writeInstallManifest } from "../install/manifest.js";
import { runUpdate } from "../commands/update.js";

export interface DoctorFixOptions {
  cwd: string;
  manifest: InstallManifest;
  dryRun?: boolean;
  force?: boolean;
  fixUpdate?: boolean;
  noCache?: boolean;
}

export interface DoctorFixResult {
  fixed: string[];
  skipped: string[];
}

export async function runDoctorFix(
  options: DoctorFixOptions,
): Promise<DoctorFixResult> {
  const { cwd, manifest, dryRun, force, fixUpdate, noCache } = options;

  if (fixUpdate) {
    await runUpdate({ cwd, yes: true, noCache, json: true, dryRun });
    return { fixed: [], skipped: [] };
  }

  const { planned } = await planFromManifest(cwd, manifest, noCache);
  const diff = await comparePlannedToDisk(planned);
  const toFix: PlannedWrite[] = [];

  for (const entry of diff) {
    if (entry.status === "unchanged") continue;

    const write = planned.find((p) => p.dest === entry.dest);
    if (!write) continue;

    if (entry.status === "create") {
      toFix.push(write);
      continue;
    }

    if (!force) {
      const content = await readTextFile(entry.dest);
      if (!content.includes(WATERMARK)) continue;
    }

    toFix.push(write);
  }

  if (toFix.length === 0) {
    return { fixed: [], skipped: [] };
  }

  const policy = manifest.conflictPolicy ?? { default: "replace" as const };
  const result = await executePlan(toFix, { dryRun, policy, cwd });

  if (!dryRun && result.written.length > 0) {
    const hashes = await buildContentHashes(result.written);
    await writeInstallManifest(cwd, {
      ...manifest,
      contentHashes: { ...manifest.contentHashes, ...hashes },
      installedAt: new Date().toISOString(),
    });
  }

  const skipped = toFix
    .map((w) => w.dest)
    .filter((d) => !result.written.includes(d));

  return { fixed: result.written, skipped };
}

/** Used by tests to verify doctor/diff alignment */
export async function collectDriftPaths(
  cwd: string,
  manifest: InstallManifest,
  noCache?: boolean,
): Promise<string[]> {
  const { planned } = await planFromManifest(cwd, manifest, noCache);
  const diff = await comparePlannedToDisk(planned);
  return diff
    .filter((f) => f.status === "modify" || f.status === "create")
    .map((f) => f.dest);
}
