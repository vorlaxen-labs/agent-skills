import { Command } from "commander";
import { removeHubSubscriptions } from "../config.js";
import { readHubScopeOpts, registerHubScopeFlags } from "./shared.js";

export function registerHubRemoveCommand(hub: Command): void {
  const cmd = hub
    .command("remove")
    .description("Unsubscribe from hub(s)")
    .argument("<hubId...>", "Hub id(s) to remove");

  registerHubScopeFlags(cmd);

  cmd.action(async (hubIds: string[], opts) => {
    const scope = readHubScopeOpts(opts);
    const path = await removeHubSubscriptions({
      cwd: scope.cwd,
      hubIds,
      project: scope.project,
    });

    if (scope.json) {
      console.log(JSON.stringify({ removed: hubIds, path }, null, 2));
      return;
    }

    console.log(`\nRemoved hub subscription(s): ${hubIds.join(", ")}\nConfig: ${path}\n`);
  });
}
