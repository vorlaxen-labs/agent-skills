import { installExternalSkills } from "../install/external-skill.js";
import { getHubSubscription, readMergedHubSubscriptions } from "./config.js";
import { loadHubCatalog } from "./catalog.js";
import type { ResolvedHubInstall } from "./types.js";

export async function resolveHubAliasesToInstall(options: {
  cwd: string;
  hubId: string;
  aliases: string[];
  refOverride?: string;
  noCache?: boolean;
}): Promise<ResolvedHubInstall[]> {
  const sub = await getHubSubscription(options.cwd, options.hubId);
  if (!sub) {
    throw new Error(
      `Hub "${options.hubId}" is not subscribed. Run: agent-skills hub add ${options.hubId}`,
    );
  }
  const { catalog } = await loadHubCatalog({
    subscription: sub,
    cwd: options.cwd,
    noCache: options.noCache,
  });

  const resolved: ResolvedHubInstall[] = [];
  for (const alias of options.aliases) {
    const entry = catalog.skills[alias];
    if (!entry) {
      throw new Error(
        `Skill alias "${alias}" not found in hub "${options.hubId}". Available: ${Object.keys(catalog.skills).join(", ") || "(none)"}`,
      );
    }
    const ref = options.refOverride ?? entry.ref ?? sub.ref;
    resolved.push({
      alias,
      source: entry.source,
      ref,
      skillName: entry.skill ?? alias,
    });
  }
  return resolved;
}

export async function installFromHub(options: {
  cwd: string;
  hubId: string;
  skillNames?: string[];
  all?: boolean;
  ref?: string;
  dryRun?: boolean;
  noCache?: boolean;
  force?: boolean;
}): Promise<{ installed: string[]; skipped: string[]; lockPath?: string }> {
  const sub = await getHubSubscription(options.cwd, options.hubId);
  if (!sub) {
    throw new Error(
      `Hub "${options.hubId}" is not subscribed. Run: agent-skills hub add ${options.hubId}`,
    );
  }
  const { catalog } = await loadHubCatalog({
    subscription: sub,
    cwd: options.cwd,
    noCache: options.noCache,
  });

  let aliases: string[];
  if (options.all) {
    aliases = Object.keys(catalog.skills);
  } else if (options.skillNames && options.skillNames.length > 0) {
    aliases = options.skillNames;
  } else {
    throw new Error("Specify skill alias(es) with -s or use --all.");
  }

  return installExternalSkills({
    cwd: options.cwd,
    source: `hub:${options.hubId}`,
    skillNames: aliases,
    ref: options.ref,
    dryRun: options.dryRun,
    noCache: options.noCache,
    force: options.force,
  });
}

export async function listSubscribedHubIds(cwd: string): Promise<string[]> {
  const subs = await readMergedHubSubscriptions(cwd);
  return subs.map((s) => s.hubId);
}
