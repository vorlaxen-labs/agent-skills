import type { SkillLockEntry } from "../lock/skills-lock.js";
import type { HubCatalog, HubSubscription } from "./types.js";
import { catalogEntrySkillName, isInsideHubRepoSource, sourcesMatch } from "./resolve-skill.js";
import { loadHubCatalog } from "./catalog.js";

export interface HubLockMatch {
  lockSkillName: string;
  hubId: string;
  alias: string;
  hubMatch: "possible";
}

export function findCatalogMatchesForLockEntry(
  lockName: string,
  entry: SkillLockEntry,
  hubId: string,
  catalog: HubCatalog,
  hubSource?: string,
): { alias: string } | null {
  for (const [alias, skillEntry] of Object.entries(catalog.skills)) {
    const skillName = catalogEntrySkillName(alias, skillEntry);
    if (skillName !== lockName) continue;
    if (sourcesMatch(entry.source, skillEntry.source)) return { alias };
    if (
      hubSource &&
      isInsideHubRepoSource(skillEntry.source) &&
      sourcesMatch(entry.source, hubSource)
    ) {
      return { alias };
    }
  }
  return null;
}

/** Newest addedAt wins when multiple hubs match the same lock row. */
export async function matchLockSkillsToHubs(options: {
  cwd: string;
  subscriptions: HubSubscription[];
  lockSkills: Record<string, SkillLockEntry>;
  noCache?: boolean;
}): Promise<Map<string, HubLockMatch>> {
  const results = new Map<string, HubLockMatch>();
  const candidates: HubLockMatch[] = [];

  for (const sub of options.subscriptions) {
    let catalog: HubCatalog;
    try {
      const loaded = await loadHubCatalog({
        subscription: sub,
        cwd: options.cwd,
        noCache: options.noCache,
        preferCache: true,
      });
      catalog = loaded.catalog;
    } catch {
      continue;
    }

    for (const [lockName, entry] of Object.entries(options.lockSkills)) {
      const match = findCatalogMatchesForLockEntry(
        lockName,
        entry,
        sub.hubId,
        catalog,
        sub.source,
      );
      if (match) {
        candidates.push({
          lockSkillName: lockName,
          hubId: sub.hubId,
          alias: match.alias,
          hubMatch: "possible",
        });
      }
    }
  }

  const subById = new Map(options.subscriptions.map((s) => [s.hubId, s]));

  for (const [lockName] of Object.entries(options.lockSkills)) {
    const forSkill = candidates.filter((c) => c.lockSkillName === lockName);
    if (forSkill.length === 0) continue;
    forSkill.sort((a, b) => {
      const atA = subById.get(a.hubId)?.addedAt ?? "";
      const atB = subById.get(b.hubId)?.addedAt ?? "";
      return atB.localeCompare(atA);
    });
    results.set(lockName, forSkill[0]!);
  }

  return results;
}
