#!/usr/bin/env node
import { Command } from "commander";
import { registerAddCommand } from "./commands/add.js";
import { registerHubCommand } from "./hub/commands/index.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerInitCommand } from "./commands/init.js";
import { registerListCommand } from "./commands/list.js";
import { registerRemoveCommand } from "./commands/remove.js";
import { registerUninstallCommand } from "./commands/uninstall.js";
import { registerUpdateCommand } from "./commands/update.js";
import { registerHelpCommand } from "./commands/help.js";
import { getPackageVersion } from "./core/version.js";

const program = new Command();

program
  .name("agent-skills")
  .description("Loader for agent skills — init global standards, add skills from any repo")
  .version(getPackageVersion());

registerInitCommand(program);
registerListCommand(program);
registerDoctorCommand(program);
registerUpdateCommand(program);
registerUninstallCommand(program);
registerAddCommand(program);
registerHubCommand(program);
registerRemoveCommand(program);
registerHelpCommand(program);

program.parseAsync().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
