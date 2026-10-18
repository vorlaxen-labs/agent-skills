import { Command } from "commander";
import { loadHubCatalog } from "../catalog.js";
import { readMergedHubSubscriptions } from "../config.js";
import { readHubScopeOpts, registerHubScopeFlags } from "./shared.js";

export function registerHubListCommand(hub: Command): void {
  const cmd = hub.command("list").description("List hub subscriptions or catalog skills");

  registerHubScopeFlags(cmd);
  cmd.option("--skills", "List skill aliases from subscribed hub catalogs");
  cmd.option("--hub <hubId>", "Limit --skills to one hub");

  cmd.action(async (opts) => {
    const scope = readHubScopeOpts(opts);
    const subscriptions = await readMergedHubSubscriptions(scope.cwd);

    const skillsMode = opts.skills || Boolean(opts.hub);

    if (!skillsMode) {
      const rows = subscriptions.map((s) => ({
        hubId: s.hubId,
        source: s.source,
        ref: s.ref,
        addedAt: s.addedAt,
      }));

      if (scope.json) {
        console.log(JSON.stringify({ mode: "subscriptions", hubs: rows }, null, 2));
        return;
      }

      if (rows.length === 0) {
        console.log("\nNo hub subscriptions.\n");
        return;
      }

      console.log("\nHub subscriptions:\n");
      for (const r of rows) {
        console.log(`  ${r.hubId}  ${r.source}@${r.ref}  (${r.addedAt})`);
      }
      console.log("");
      return;
    }

    let subs = subscriptions;
    if (opts.hub) {
      subs = subs.filter((s) => s.hubId === opts.hub);
      if (subs.length === 0) {
        throw new Error(`Hub "${opts.hub}" is not subscribed.`);
      }
    }

    const skillRows: {
      hub: string;
      alias: string;
      source: string;
      ref: string;
      description?: string;
    }[] = [];

    for (const sub of subs) {
      const { catalog } = await loadHubCatalog({
        subscription: sub,
        cwd: scope.cwd,
        noCache: scope.noCache,
      });
      for (const [alias, entry] of Object.entries(catalog.skills)) {
        skillRows.push({
          hub: sub.hubId,
          alias,
          source: entry.source,
          ref: entry.ref ?? sub.ref,
          description: entry.description,
        });
      }
    }

    if (scope.json) {
      console.log(JSON.stringify({ mode: "skills", skills: skillRows }, null, 2));
      return;
    }

    if (skillRows.length === 0) {
      console.log("\nNo skills in subscribed hubs.\n");
      return;
    }

    console.log("\nHub skills:\n");
    for (const r of skillRows) {
      const desc = r.description ? ` — ${r.description}` : "";
      console.log(`  [${r.hub}] ${r.alias}  ${r.source}@${r.ref}${desc}`);
    }
    console.log("");
  });
}
