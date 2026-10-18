import { Command } from "commander";
import { loadHubCatalog } from "../catalog.js";
import { readMergedHubSubscriptions } from "../config.js";
import { readHubScopeOpts, registerHubScopeFlags } from "./shared.js";

export function registerHubSearchCommand(hub: Command): void {
  const cmd = hub
    .command("search")
    .description("Search skill aliases in subscribed hubs")
    .argument("<query>", "Search text");

  registerHubScopeFlags(cmd);

  cmd.action(async (query: string, opts) => {
    const scope = readHubScopeOpts(opts);
    const q = query.trim().toLowerCase();
    if (!q) {
      throw new Error("Search query is required.");
    }

    const subscriptions = await readMergedHubSubscriptions(scope.cwd);
    const hits: {
      hub: string;
      alias: string;
      source: string;
      description?: string;
    }[] = [];

    for (const sub of subscriptions) {
      const { catalog } = await loadHubCatalog({
        subscription: sub,
        cwd: scope.cwd,
        noCache: scope.noCache,
      });
      for (const [alias, entry] of Object.entries(catalog.skills)) {
        const hay = `${alias} ${entry.description ?? ""}`.toLowerCase();
        if (hay.includes(q)) {
          hits.push({
            hub: sub.hubId,
            alias,
            source: entry.source,
            description: entry.description,
          });
        }
      }
    }

    if (scope.json) {
      console.log(JSON.stringify({ query, hits }, null, 2));
      return;
    }

    if (hits.length === 0) {
      console.log(`\nNo matches for "${query}".\n`);
      return;
    }

    console.log(`\nMatches for "${query}":\n`);
    for (const h of hits) {
      const desc = h.description ? ` — ${h.description}` : "";
      console.log(`  [${h.hub}] ${h.alias}  ${h.source}${desc}`);
    }
    console.log("");
  });
}
