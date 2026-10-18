import { Command } from "commander";
import { unifiedDiff } from "../../diff/unified.js";
import { readHubCatalogCache } from "../catalog-cache.js";
import { fetchHubCatalogRaw, parseHubCatalog } from "../catalog.js";
import { getHubSubscription } from "../config.js";
import { readHubScopeOpts, registerHubScopeFlags } from "./shared.js";

export async function runHubDiff(options: {
  cwd: string;
  hubId: string;
  noCache?: boolean;
}): Promise<{ diffText: string; stderrNotes: string[] }> {
  const sub = await getHubSubscription(options.cwd, options.hubId);
  if (!sub) {
    throw new Error(`Hub "${options.hubId}" is not subscribed.`);
  }

  const notes: string[] = [];
  let cached: string | null = null;

  if (!options.noCache) {
    cached = await readHubCatalogCache(sub.hubId, sub.ref);
    if (cached !== null) {
      try {
        parseHubCatalog(JSON.parse(cached));
      } catch {
        throw new Error("Cached catalog is invalid. Run: agent-skills hub doctor");
      }
    }
  } else {
    notes.push("Cache skipped; diff is only meaningful when comparing cache vs remote.");
  }

  const remote = await fetchHubCatalogRaw(sub, options.cwd, options.noCache ?? false);
  parseHubCatalog(JSON.parse(remote));

  if (cached === null && !options.noCache) {
    notes.push("No cache on disk; fetched remote only. Run hub update to persist cache.");
  }

  if (options.noCache || cached === null) {
    return { diffText: "", stderrNotes: notes };
  }

  const diffText = unifiedDiff(
    "cache",
    "remote",
    cached,
    remote,
  );

  return { diffText, stderrNotes: notes };
}

export function registerHubDiffCommand(hub: Command): void {
  const cmd = hub
    .command("diff")
    .description("Diff cached vs remote hub catalog")
    .argument("<hubId>", "Hub id");

  registerHubScopeFlags(cmd);

  cmd.action(async (hubId: string, opts) => {
    const scope = readHubScopeOpts(opts);
    const { diffText, stderrNotes } = await runHubDiff({
      cwd: scope.cwd,
      hubId,
      noCache: scope.noCache,
    });

    for (const n of stderrNotes) {
      console.error(n);
    }

    if (scope.json) {
      console.log(JSON.stringify({ hubId, diff: diffText }, null, 2));
      return;
    }

    if (diffText) {
      console.log(diffText);
    }
  });
}
