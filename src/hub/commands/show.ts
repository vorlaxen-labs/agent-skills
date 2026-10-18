import { Command } from "commander";
import { loadHubCatalog } from "../catalog.js";
import { getHubSubscription } from "../config.js";
import { readHubScopeOpts, registerHubScopeFlags } from "./shared.js";

export function registerHubShowCommand(hub: Command): void {
  const cmd = hub
    .command("show")
    .description("Show one hub catalog")
    .argument("<hubId>", "Hub id");

  registerHubScopeFlags(cmd);

  cmd.action(async (hubId: string, opts) => {
    const scope = readHubScopeOpts(opts);
    const sub = await getHubSubscription(scope.cwd, hubId);
    if (!sub) {
      throw new Error(`Hub "${hubId}" is not subscribed.`);
    }

    const { catalog, fromCache } = await loadHubCatalog({
      subscription: sub,
      cwd: scope.cwd,
      noCache: scope.noCache,
    });

    if (scope.json) {
      console.log(JSON.stringify({ hubId, fromCache, catalog }, null, 2));
      return;
    }

    console.log(`\nHub: ${catalog.id} (${fromCache ? "cache" : "remote"})\n`);
    for (const [alias, entry] of Object.entries(catalog.skills)) {
      const desc = entry.description ? ` — ${entry.description}` : "";
      console.log(`  ${alias}  ${entry.source}@${entry.ref ?? sub.ref}${desc}`);
    }
    console.log("");
  });
}
