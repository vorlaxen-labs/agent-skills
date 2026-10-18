import { Command } from "commander";
import { registerHubAddCommand } from "./add.js";
import { registerHubDiffCommand } from "./diff.js";
import { registerHubDoctorCommand } from "./doctor.js";
import { registerHubInstallCommand } from "./install.js";
import { registerHubListCommand } from "./list.js";
import { registerHubRemoveCommand } from "./remove.js";
import { registerHubSearchCommand } from "./search.js";
import { registerHubShowCommand } from "./show.js";
import { registerHubStatusCommand } from "./status.js";
import { registerHubUpdateCommand } from "./update.js";

export function registerHubCommand(program: Command): void {
  const hub = program
    .command("hub")
    .description("Subscribe to skill hubs and install from catalogs");

  registerHubAddCommand(hub);
  registerHubRemoveCommand(hub);
  registerHubListCommand(hub);
  registerHubShowCommand(hub);
  registerHubInstallCommand(hub);
  registerHubUpdateCommand(hub);
  registerHubStatusCommand(hub);
  registerHubDoctorCommand(hub);
  registerHubDiffCommand(hub);
  registerHubSearchCommand(hub);
}
