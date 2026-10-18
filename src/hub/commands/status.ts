import { Command } from "commander";
import { hubCatalogCacheAgeMs } from "../catalog-cache.js";
import { readMergedHubSubscriptions } from "../config.js";
import { matchLockSkillsToHubs } from "../match-lock.js";
import { readSkillsLock } from "../../lock/skills-lock.js";
import { readHubScopeOpts, registerHubScopeFlags } from "./shared.js";

export function registerHubStatusCommand(hub: Command): void {
  const cmd = hub.command("status").description("Hub subscriptions and possible lock matches");

  registerHubScopeFlags(cmd);

  cmd.action(async (opts) => {
    const scope = readHubScopeOpts(opts);
    const subscriptions = await readMergedHubSubscriptions(scope.cwd);
    const lock = await readSkillsLock(scope.cwd);
    const matches = await matchLockSkillsToHubs({
      cwd: scope.cwd,
      subscriptions,
      lockSkills: lock.skills,
      noCache: scope.noCache,
    });

    const hubRows = await Promise.all(
      subscriptions.map(async (s) => ({
        hubId: s.hubId,
        source: s.source,
        ref: s.ref,
        addedAt: s.addedAt,
        cacheAgeMs: await hubCatalogCacheAgeMs(s.hubId, s.ref),
      })),
    );

    const lockRows = Object.keys(lock.skills).map((name) => {
      const m = matches.get(name);
      return {
        skill: name,
        source: lock.skills[name]!.source,
        hubMatch: m ? ("possible" as const) : ("none" as const),
        hubId: m?.hubId,
        alias: m?.alias,
      };
    });

    if (scope.json) {
      console.log(JSON.stringify({ hubs: hubRows, installedSkills: lockRows }, null, 2));
      return;
    }

    console.log("\nHub subscriptions:\n");
    if (hubRows.length === 0) {
      console.log("  (none)");
    } else {
      for (const h of hubRows) {
        const age =
          h.cacheAgeMs === null ? "no cache" : `${Math.round(h.cacheAgeMs / 1000)}s ago`;
        console.log(`  ${h.hubId}  ${h.source}@${h.ref}  cache: ${age}`);
      }
    }

    console.log("\nInstalled skills (lock):\n");
    if (lockRows.length === 0) {
      console.log("  (none)");
    } else {
      for (const r of lockRows) {
        if (r.hubMatch === "possible") {
          console.log(
            `  ${r.skill}  ${r.source}  — may match hub (${r.hubId}/${r.alias})`,
          );
        } else {
          console.log(`  ${r.skill}  ${r.source}`);
        }
      }
    }
    console.log("");
  });
}
