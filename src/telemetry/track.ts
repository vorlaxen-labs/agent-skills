import { buildTelemetryContext, loadSessionIdFromConfig } from "./context.js";
import { readTelemetryConfig } from "./config.js";
import { sendTelemetryEvent } from "./client.js";
import type { CommandCompletedProperties, TelemetryEvent } from "./types.js";

const INSTALL_COMMANDS = new Set(["init", "add", "remove", "update"]);

function envTelemetryOverride(): boolean | undefined {
  const env = process.env.VORLAXEN_TELEMETRY?.trim().toLowerCase();
  if (env === undefined || env.length === 0) {
    return undefined;
  }
  if (env === "0" || env === "false" || env === "no") {
    return false;
  }
  if (env === "1" || env === "true" || env === "yes") {
    return true;
  }
  return undefined;
}

export async function resolveTelemetryEnabled(
  noTelemetryFlag = false,
): Promise<boolean> {
  if (noTelemetryFlag) {
    return false;
  }

  const envOverride = envTelemetryOverride();
  if (envOverride !== undefined) {
    return envOverride;
  }

  const config = await readTelemetryConfig();
  return config.enabled;
}

export function extractCommandProperties(
  commandName: string,
  commandOpts: Record<string, unknown>,
  args: string[],
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};

  if (typeof commandOpts.platform === "string") {
    properties.platform = commandOpts.platform;
  }

  if (Array.isArray(commandOpts.skills)) {
    properties.skills_count = commandOpts.skills.length;
  } else if (commandName === "add") {
    const fromFlag = commandOpts.skill;
    if (Array.isArray(fromFlag) && fromFlag.length > 0) {
      properties.skills_count = fromFlag.length;
    } else {
      properties.skills_count = Math.max(0, args.length - 1);
    }
    if (typeof args[0] === "string") {
      properties.source = args[0];
    }
  } else if (commandName === "remove") {
    properties.skills_count = args.length;
  }

  if (commandOpts.remote !== undefined) {
    properties.remote = true;
  }

  if (commandOpts.dryRun === true) {
    properties.dry_run = true;
  }

  return properties;
}

export async function trackEvent(
  event: string,
  properties: Record<string, unknown>,
  options: { noTelemetry?: boolean } = {},
): Promise<void> {
  if (!(await resolveTelemetryEnabled(options.noTelemetry))) {
    return;
  }

  await loadSessionIdFromConfig();

  const payload: TelemetryEvent = {
    event,
    properties,
    context: buildTelemetryContext(),
  };

  void sendTelemetryEvent(payload);
}

export async function trackCommand(options: {
  command: string;
  durationMs: number;
  exitCode: number;
  noTelemetry?: boolean;
  commandOpts?: Record<string, unknown>;
  args?: string[];
}): Promise<void> {
  if (!(await resolveTelemetryEnabled(options.noTelemetry))) {
    return;
  }

  const extra =
    INSTALL_COMMANDS.has(options.command) && options.commandOpts
      ? extractCommandProperties(
          options.command,
          options.commandOpts,
          options.args ?? [],
        )
      : {};

  const properties: CommandCompletedProperties = {
    command: options.command,
    duration_ms: options.durationMs,
    exit_code: options.exitCode,
    ...(extra as Partial<CommandCompletedProperties>),
  };

  await trackEvent("cli.command.completed", { ...properties }, {
    noTelemetry: options.noTelemetry,
  });
}
