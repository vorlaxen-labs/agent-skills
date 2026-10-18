import { Command } from "commander";
import { runAdd } from "../../commands/add.js";
import { installFromHub } from "../install-from-hub.js";
import { readHubScopeOpts, registerHubScopeFlags } from "./shared.js";

export function registerHubInstallCommand(hub: Command): void {
  const cmd = hub
    .command("install")
    .description("Install skills from a subscribed hub (sugar for add hub:<id>)")
    .argument("<hubId>", "Hub id")
    .option("-s, --skill <names...>", "Skill alias(es)")
    .option("--all", "Install all skills listed in the hub catalog")
    .option("--ref <git-ref>", "Override git ref for skill sources")
    .option("-y, --yes", "Non-interactive")
    .option("--dry-run", "Plan without writing");

  registerHubScopeFlags(cmd);

  cmd.action(async (hubId: string, opts) => {
    const scope = readHubScopeOpts(opts);
    const skillNames = opts.skill as string[] | undefined;

    if (opts.all) {
      const result = await installFromHub({
        cwd: scope.cwd,
        hubId,
        all: true,
        ref: opts.ref,
        dryRun: opts.dryRun,
        noCache: scope.noCache,
      });
      if (scope.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      if (result.installed.length) {
        console.log(`\nInstalled: ${result.installed.join(", ")}`);
      }
      if (result.skipped.length) {
        console.log(`Already present (skipped): ${result.skipped.join(", ")}`);
      }
      console.log("");
      return;
    }

    if (!skillNames || skillNames.length === 0) {
      throw new Error("Specify -s/--skill <alias> or use --all.");
    }

    await runAdd({
      cwd: scope.cwd,
      source: `hub:${hubId}`,
      skillNames,
      ref: opts.ref,
      yes: opts.yes,
      dryRun: opts.dryRun,
      json: scope.json,
      noCache: scope.noCache,
      verbose: scope.verbose,
    });
  });
}
