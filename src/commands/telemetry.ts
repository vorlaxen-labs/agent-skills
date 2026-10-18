import { Command, InvalidArgumentError } from "commander";
import {
  getTelemetryConfigPath,
  readTelemetryConfig,
  setTelemetryEnabled,
} from "../telemetry/config.js";
import { setOutputOptions } from "../core/output.js";

export type TelemetryAction = "status" | "yes" | "no";

export interface TelemetryOptions {
  action: TelemetryAction;
  json?: boolean;
}

function parseTelemetryAction(value: string): TelemetryAction {
  const normalized = value.trim().toLowerCase();
  if (normalized === "status" || normalized === "yes" || normalized === "no") {
    return normalized;
  }
  throw new InvalidArgumentError(
    `Unknown telemetry action "${value}". Use: status, yes, or no.`,
  );
}

export async function runTelemetry(options: TelemetryOptions): Promise<void> {
  setOutputOptions({ json: options.json ?? false, verbose: false });

  if (options.action === "status") {
    const config = await readTelemetryConfig();
    const payload = {
      enabled: config.enabled,
      configPath: getTelemetryConfigPath(),
    };

    if (options.json) {
      console.log(JSON.stringify(payload, null, 2));
      return;
    }

    console.log(
      `\nTelemetry is ${config.enabled ? "enabled" : "disabled"}.\nConfig: ${payload.configPath}\n`,
    );
    return;
  }

  const enabled = options.action === "yes";
  const config = await setTelemetryEnabled(enabled);

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          enabled: config.enabled,
          configPath: getTelemetryConfigPath(),
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(
    `\nTelemetry ${config.enabled ? "enabled" : "disabled"}.\nConfig: ${getTelemetryConfigPath()}\n`,
  );
}

export function registerTelemetryCommand(program: Command): void {
  program
    .command("telemetry")
    .description("Manage anonymous usage telemetry preference")
    .argument("<action>", "status, yes, or no", parseTelemetryAction)
    .option("--json", "Machine-readable output")
    .action(async (action: TelemetryAction, opts: { json?: boolean }) => {
      await runTelemetry({ action, json: opts.json });
    });
}
