import { Command } from "commander";
import { loadHubCatalog } from "../catalog.js";
import {
  getProjectHubsConfigPath,
  getUserHubsConfigPath,
  readHubsFile,
  removeHubSubscriptions,
} from "../config.js";
import { readHubScopeOpts, registerHubScopeFlags } from "./shared.js";

export function registerHubDoctorCommand(hub: Command): void {
  const cmd = hub
    .command("doctor")
    .description("Check hub subscriptions and catalogs")
    .option("--fix", "Remove invalid subscription entries")
    .option("-y, --yes", "Skip confirmation for --fix");

  registerHubScopeFlags(cmd);

  cmd.action(async (opts) => {
    const scope = readHubScopeOpts(opts);
    const checks: { path: string; project: boolean }[] = scope.project
      ? [{ path: getProjectHubsConfigPath(scope.cwd), project: true }]
      : [
          { path: getUserHubsConfigPath(), project: false },
          { path: getProjectHubsConfigPath(scope.cwd), project: false },
        ];

    const issues: { hubId: string; message: string; project: boolean }[] = [];

    for (const { path, project } of checks) {
      const file = await readHubsFile(path);
      if (!file) continue;

      for (const sub of Object.values(file.hubs)) {
        try {
          await loadHubCatalog({
            subscription: sub,
            cwd: scope.cwd,
            noCache: scope.noCache,
            preferCache: true,
          });
        } catch (err) {
          issues.push({
            hubId: sub.hubId,
            project,
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    if (scope.json) {
      console.log(JSON.stringify({ ok: issues.length === 0, issues }, null, 2));
      if (issues.length > 0) process.exitCode = 1;
      return;
    }

    if (issues.length === 0) {
      console.log("\nHub subscriptions OK.\n");
      return;
    }

    console.log("\nHub doctor found issues:\n");
    for (const i of issues) {
      console.log(`  [${i.hubId}] ${i.message}`);
    }

    if (opts.fix) {
      for (const i of issues) {
        await removeHubSubscriptions({
          cwd: scope.cwd,
          hubIds: [i.hubId],
          project: i.project,
        });
      }
      console.log("\nRemoved invalid entries (--fix).\n");
    } else {
      console.log("\nRun with --fix to remove invalid entries.\n");
      process.exitCode = 1;
    }
  });
}
