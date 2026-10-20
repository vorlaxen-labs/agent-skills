import { Command } from "commander";
import { registerHubAddCommand } from "./add.js";
import { registerHubInstallCommand } from "./install.js";
import { registerHubListCommand } from "./list.js";
import { registerHubRemoveCommand } from "./remove.js";
import { registerHubUpdateCommand } from "./update.js";

export function registerHubCommand(program: Command): void {
  const hub = program
    .command("hub")
    .description("Subscribe to skill hubs and install from catalogs");

  registerHubAddCommand(hub);
  registerHubRemoveCommand(hub);
  registerHubListCommand(hub);
  registerHubInstallCommand(hub);
  registerHubUpdateCommand(hub);
}
