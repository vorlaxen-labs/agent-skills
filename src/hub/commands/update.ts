import { Command } from "commander";
import { refreshHubCatalogCache } from "../catalog.js";
import { readMergedHubSubscriptions } from "../config.js";
import { matchLockSkillsToHubs } from "../match-lock.js";
import { installExternalSkills } from "../../install/external-skill.js";
import { readSkillsLock } from "../../lock/skills-lock.js";
import { readHubScopeOpts, registerHubScopeFlags } from "./shared.js";

export function registerHubUpdateCommand(hub: Command): void {
  const cmd = hub
    .command("update")
    .description("Refresh hub catalog cache; optionally update installed skills")
    .argument("[hubIds...]", "Hub id(s); default: all subscriptions")
    .option("--skills", "Reinstall project skills that match hub catalog entries");

  registerHubScopeFlags(cmd);

  cmd.action(async (hubIds: string[], opts) => {
    const scope = readHubScopeOpts(opts);
    let subscriptions = await readMergedHubSubscriptions(scope.cwd);

    if (hubIds.length > 0) {
      subscriptions = subscriptions.filter((s) => hubIds.includes(s.hubId));
      const missing = hubIds.filter((id) => !subscriptions.some((s) => s.hubId === id));
      if (missing.length > 0) {
        throw new Error(`Hub(s) not subscribed: ${missing.join(", ")}`);
      }
    }

    if (subscriptions.length === 0) {
      throw new Error("No hub subscriptions to update.");
    }

    for (const sub of subscriptions) {
      await refreshHubCatalogCache({
        subscription: sub,
        cwd: scope.cwd,
        noCache: scope.noCache,
      });
    }

    let skillsUpdated: string[] = [];

    if (opts.skills) {
      const lock = await readSkillsLock(scope.cwd);
      const subsForMatch =
        hubIds.length > 0
          ? subscriptions
          : await readMergedHubSubscriptions(scope.cwd);
      const matches = await matchLockSkillsToHubs({
        cwd: scope.cwd,
        subscriptions: subsForMatch,
        lockSkills: lock.skills,
        noCache: scope.noCache,
      });

      for (const [lockName, match] of matches.entries()) {
        if (hubIds.length > 0 && !hubIds.includes(match.hubId)) {
          continue;
        }
        const result = await installExternalSkills({
          cwd: scope.cwd,
          source: lock.skills[lockName]!.source,
          skillNames: [lockName],
          ref: lock.skills[lockName]!.ref,
          noCache: scope.noCache,
          force: true,
        });
        skillsUpdated.push(...result.installed);
      }
      skillsUpdated = [...new Set(skillsUpdated)];
    }

    if (scope.json) {
      console.log(
        JSON.stringify(
          {
            catalogsRefreshed: subscriptions.length,
            skillsUpdated: opts.skills ? skillsUpdated : undefined,
          },
          null,
          2,
        ),
      );
      return;
    }

    console.log(
      `\nRefreshed catalog cache for ${subscriptions.length} hub(s).${opts.skills ? "" : " Installed skill files were not changed; to refresh them run: hub update --skills"}`,
    );
    if (opts.skills) {
      if (skillsUpdated.length > 0) {
        console.log(` Updated ${skillsUpdated.length} skill(s): ${skillsUpdated.join(", ")}`);
      } else {
        console.log(" No matching installed skills found.");
      }
    }
    console.log("");
  });
}
