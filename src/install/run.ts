import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SKILLS, type Platform } from "../core/bundled-catalog.js";
import { detectConflicts } from "../conflict/detect.js";
import { defaultPolicyOverrides, normalizePolicyV2 } from "../conflict/path-policy.js";
import { policyFromManifest, resolvePolicy } from "../conflict/resolve.js";
import type { AppendOrder, ConflictPolicyV2, ConflictStrategy } from "../conflict/types.js";
import { logVerbose } from "../core/output.js";
import { resolveSource, type RemoteRef } from "../source/resolve.js";
import { getPackageVersion } from "../core/version.js";
import { collectPaths } from "./collect-paths.js";
import { executePlan } from "./executor.js";
import {
  buildContentHashes,
  buildManifest,
  mergeManifests,
  readInstallManifest,
  writeInstallManifest,
  type InstallManifest,
} from "./manifest.js";
import { planInstall } from "./planners/index.js";
import { agentRootPath, planForSkills } from "./skill-paths.js";
import type { InstallContext, InstallResult } from "./types.js";

const bundledRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "bundled",
);

export interface RunInstallOptions {
  cwd: string;
  platform: Platform;
  skillIds: string[];
  remote?: RemoteRef;
  dryRun?: boolean;
  onConflict?: ConflictStrategy;
  appendOrder?: AppendOrder;
  yes?: boolean;
  nonInteractive?: boolean;
  yesConflictDefault?: ConflictStrategy;
  noCache?: boolean;
  showFetchMessage?: boolean;
  /** Merge result into existing manifest (add command) */
  mergeManifest?: boolean;
  /** Only plan/write paths for these skill ids (subset of skillIds) */
  installSkillIds?: string[];
  /** Existing manifest policy to inherit */
  manifestPolicy?: ConflictPolicyV2 | null;
  conflictOverrides?: Record<string, ConflictStrategy>;
}

export interface RunInstallResult {
  platform: Platform;
  skillIds: string[];
  remote?: RemoteRef;
  result: InstallResult;
  conflictPolicy: ConflictPolicyV2 | null;
  manifestPath?: string;
}

export async function runInstall(
  options: RunInstallOptions,
): Promise<RunInstallResult> {
  const {
    cwd,
    platform,
    skillIds,
    remote,
    dryRun,
    onConflict,
    appendOrder,
    yes,
    nonInteractive,
    yesConflictDefault = "append",
    noCache,
    showFetchMessage = true,
    mergeManifest,
    installSkillIds,
    manifestPolicy,
    conflictOverrides,
  } = options;

  const targetSkillIds = installSkillIds ?? skillIds;
  const paths = collectPaths(targetSkillIds);
  const packageVersion = getPackageVersion();
  const source = resolveSource(remote, packageVersion, bundledRoot, { noCache });

  logVerbose(`Fetching paths: ${paths.join(", ")}`);
  if (showFetchMessage) {
    const { getOutputOptions } = await import("../core/output.js");
    if (!getOutputOptions().json) console.log("\nFetching selected skills…");
  }

  const files = await source.fetch(paths);
  const allSkills = SKILLS.filter((s) => skillIds.includes(s.id));
  const installSkills = SKILLS.filter((s) => targetSkillIds.includes(s.id));

  let planned = planForSkills(platform, { cwd, skills: installSkills, files }, targetSkillIds);

  if (mergeManifest && targetSkillIds.length < skillIds.length) {
    const composite = planCompositeAgentFile(platform, { cwd, skills: allSkills, files });
    if (composite) {
      planned = [...planned.filter((p) => p.dest !== composite.dest), composite];
    }
  }

  logVerbose(`Planned ${planned.length} file write(s)`);

  const conflicts = await detectConflicts(planned);
  logVerbose(`Detected ${conflicts.length} conflict(s)`);

  const inherited = policyFromManifest(manifestPolicy ?? null, onConflict, appendOrder);
  const useInherited =
    inherited &&
    (onConflict === "inherit" || (onConflict === undefined && manifestPolicy !== undefined));

  const explicitConflict =
    onConflict && onConflict !== "inherit" ? onConflict : undefined;
  const resolvedConflict =
    explicitConflict ??
    (yes || nonInteractive ? yesConflictDefault : undefined);

  let policy: ConflictPolicyV2 | null;
  if (useInherited) {
    policy = {
      ...inherited!,
      overrides: {
        ...(inherited!.default === "append" ? defaultPolicyOverrides() : {}),
        ...inherited!.overrides,
        ...conflictOverrides,
      },
    };
  } else {
    policy = await resolvePolicy(conflicts, {
      yes: (yes || nonInteractive) && resolvedConflict === undefined,
      onConflict: resolvedConflict,
      appendOrder,
      interactive: !yes && !nonInteractive && !onConflict,
      conflictOverrides,
    });
  }

  if (!policy && resolvedConflict) {
    policy = normalizePolicyV2({ default: resolvedConflict, appendOrder });
  }

  const result = await executePlan(planned, { dryRun, policy, cwd });

  let manifestPath: string | undefined;
  if (!dryRun && (result.written.length > 0 || mergeManifest)) {
    const existingManifest = mergeManifest ? await readInstallManifest(cwd) : null;
    const contentHashes = {
      ...(existingManifest?.contentHashes ?? {}),
      ...(await buildContentHashes(result.written)),
    };
    const incoming = buildManifest(
      cwd,
      platform,
      mergeManifest ? skillIds : targetSkillIds,
      remote,
      policy,
      result,
      contentHashes,
    );

    let manifest: InstallManifest = incoming;
    if (mergeManifest) {
      const existing = await readInstallManifest(cwd);
      manifest = mergeManifests(existing, {
        ...incoming,
        skills: skillIds,
        platform: existing.platform,
      });
      manifest.contentHashes = {
        ...manifest.contentHashes,
        ...contentHashes,
      };
    }

    manifestPath = await writeInstallManifest(cwd, manifest);
    logVerbose(`Wrote manifest to ${manifestPath}`);
  }

  return {
    platform,
    skillIds,
    remote,
    result,
    conflictPolicy: policy,
    manifestPath,
  };
}

function planCompositeAgentFile(
  platform: Platform,
  ctx: InstallContext,
): { dest: string; content: string } | null {
  const root = agentRootPath(ctx.cwd, platform);
  if (!root) return null;
  const planned = planInstall(platform, ctx);
  const match = planned.find((p) => p.dest === root);
  return match ?? null;
}

export async function planFromManifest(
  cwd: string,
  manifest: InstallManifest,
  noCache?: boolean,
): Promise<{ planned: ReturnType<typeof planInstall>; ctx: InstallContext }> {
  const paths = collectPaths(manifest.skills);
  const source = resolveSource(
    manifest.remote ?? undefined,
    getPackageVersion(),
    bundledRoot,
    { noCache },
  );
  const files = await source.fetch(paths);
  const skills = SKILLS.filter((s) => manifest.skills.includes(s.id));
  const ctx: InstallContext = { cwd, skills, files };
  const planned = planInstall(manifest.platform, ctx);
  return { planned, ctx };
}

export async function rebuildAgentRootFile(
  cwd: string,
  manifest: InstallManifest,
  noCache?: boolean,
): Promise<InstallResult> {
  const { planned, ctx } = await planFromManifest(cwd, manifest, noCache);
  const root = agentRootPath(cwd, manifest.platform);
  if (!root) return { written: [], skipped: [] };

  const write = planned.find((p) => p.dest === root);
  if (!write) return { written: [], skipped: [] };

  const policy = manifest.conflictPolicy ?? {
    default: "replace",
    overrides: defaultPolicyOverrides(),
  };

  return executePlan([write], { policy, cwd });
}
