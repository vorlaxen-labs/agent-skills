import { Command } from "commander";
import { HUB_CATALOG_FILENAME } from "../constants.js";
import { loadHubCatalog } from "../catalog.js";
import { upsertHubSubscription } from "../config.js";
import { resolveHubAddInput } from "../resolve-input.js";
import type { HubSubscription } from "../types.js";
import { parseSource } from "../../source/parse-source.js";
import { readHubScopeOpts, registerHubScopeFlags } from "./shared.js";

export function registerHubAddCommand(hub: Command): void {
  const cmd = hub
    .command("add")
    .description("Subscribe to a skills hub")
    .argument("<id-or-source>", "Hub id (e.g. vorlaxen-skills-hub) or owner/repo")
    .option("--ref <git-ref>", "Git ref for catalog repo (default: main)");

  registerHubScopeFlags(cmd);

  cmd.action(async (input: string, opts) => {
    const scope = readHubScopeOpts(opts);
    const ref = opts.ref ?? "main";
    const target = resolveHubAddInput(input);
    parseSource(target.source, ref);

    const provisional: HubSubscription = {
      hubId: target.hubIdHint ?? "_pending_",
      source: target.source,
      ref,
      manifestPath: HUB_CATALOG_FILENAME,
      addedAt: new Date().toISOString(),
    };

    let catalog;
    try {
      const loaded = await loadHubCatalog({
        subscription: provisional,
        cwd: scope.cwd,
        noCache: scope.noCache,
        preferCache: false,
        validateHubId: false,
      });
      catalog = loaded.catalog;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Could not fetch or validate ${HUB_CATALOG_FILENAME} from "${target.source}": ${msg}`,
      );
    }

    const subscription: HubSubscription = {
      hubId: catalog.id,
      source: target.source,
      ref,
      manifestPath: HUB_CATALOG_FILENAME,
      addedAt: new Date().toISOString(),
    };

    const path = await upsertHubSubscription({
      cwd: scope.cwd,
      subscription,
      project: scope.project,
    });

    if (scope.json) {
      console.log(
        JSON.stringify(
          {
            hubId: catalog.id,
            path,
            skillCount: Object.keys(catalog.skills).length,
          },
          null,
          2,
        ),
      );
      return;
    }

    console.log(
      `\nSubscribed to hub "${catalog.id}" (${Object.keys(catalog.skills).length} skills).\nConfig: ${path}\n`,
    );
  });
}
