#!/usr/bin/env node
import { Command } from "commander";
import { registerAddCommand } from "./commands/add.js";
import { registerHubCommand } from "./hub/commands/index.js";
import { registerCompletionCommand } from "./commands/completion.js";
import { registerDiffCommand } from "./commands/diff.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerInitCommand } from "./commands/init.js";
import { registerListCommand } from "./commands/list.js";
import { registerRemoveCommand } from "./commands/remove.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerTelemetryCommand } from "./commands/telemetry.js";
import { registerUninstallCommand } from "./commands/uninstall.js";
import { registerUpdateCommand } from "./commands/update.js";
import { registerHelpCommand } from "./commands/help.js";
import { trackCommand } from "./telemetry/track.js";
import { getPackageVersion } from "./core/version.js";

const program = new Command();
let commandStartedAt = 0;

program
  .name("agent-skills")
  .description("Loader for agent skills — init global standards, add skills from any repo")
  .version(getPackageVersion())
  .option("--no-telemetry", "Disable anonymous usage telemetry for this run");

registerInitCommand(program);
registerListCommand(program);
registerDoctorCommand(program);
registerUpdateCommand(program);
registerDiffCommand(program);
registerUninstallCommand(program);
registerAddCommand(program);
registerHubCommand(program);
registerRemoveCommand(program);
registerStatusCommand(program);
registerTelemetryCommand(program);
registerCompletionCommand(program);
registerHelpCommand(program);

program.hook("preAction", () => {
  commandStartedAt = Date.now();
});

program.hook("postAction", (_thisCommand, actionCommand) => {
  if (actionCommand.name() === "telemetry") {
    return;
  }

  const globals = actionCommand.optsWithGlobals() as { noTelemetry?: boolean };
  void trackCommand({
    command: actionCommand.name(),
    durationMs: Date.now() - commandStartedAt,
    exitCode: typeof process.exitCode === "number" ? process.exitCode : 0,
    noTelemetry: globals.noTelemetry ?? false,
    commandOpts: actionCommand.opts() as Record<string, unknown>,
    args: actionCommand.args as string[],
  });
});

program.parseAsync().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
