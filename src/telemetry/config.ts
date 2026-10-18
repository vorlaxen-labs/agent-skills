import { homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { pathExists, readTextFile, writeTextFile } from "../core/fs.js";

export const TELEMETRY_CONFIG_SCHEMA_VERSION = 1;

export interface TelemetryConfig {
  schemaVersion: number;
  enabled: boolean;
  anonymousId: string;
  updatedAt: string;
}

let configPathOverride: string | undefined;

export function setTelemetryConfigPathForTests(path: string | undefined): void {
  configPathOverride = path;
}

export function getTelemetryConfigPath(): string {
  if (configPathOverride !== undefined) {
    return configPathOverride;
  }

  const base = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  return join(base, "vorlaxen", "telemetry.json");
}

function defaultConfig(enabled = true): TelemetryConfig {
  return {
    schemaVersion: TELEMETRY_CONFIG_SCHEMA_VERSION,
    enabled,
    anonymousId: randomUUID(),
    updatedAt: new Date().toISOString(),
  };
}

function parseTelemetryConfig(raw: string): TelemetryConfig {
  const parsed = JSON.parse(raw) as Partial<TelemetryConfig>;

  if (typeof parsed.enabled !== "boolean") {
    throw new Error("Invalid telemetry config: enabled must be a boolean.");
  }

  if (typeof parsed.anonymousId !== "string" || parsed.anonymousId.length === 0) {
    throw new Error("Invalid telemetry config: anonymousId is required.");
  }

  return {
    schemaVersion:
      typeof parsed.schemaVersion === "number"
        ? parsed.schemaVersion
        : TELEMETRY_CONFIG_SCHEMA_VERSION,
    enabled: parsed.enabled,
    anonymousId: parsed.anonymousId,
    updatedAt:
      typeof parsed.updatedAt === "string"
        ? parsed.updatedAt
        : new Date().toISOString(),
  };
}

export async function readTelemetryConfig(): Promise<TelemetryConfig> {
  const configPath = getTelemetryConfigPath();
  if (!(await pathExists(configPath))) {
    return defaultConfig(true);
  }

  const raw = await readTextFile(configPath);
  return parseTelemetryConfig(raw);
}

export async function writeTelemetryConfig(config: TelemetryConfig): Promise<void> {
  const configPath = getTelemetryConfigPath();
  await writeTextFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

export async function setTelemetryEnabled(enabled: boolean): Promise<TelemetryConfig> {
  const existing = await readTelemetryConfig();
  const hasFile = await pathExists(getTelemetryConfigPath());

  const next: TelemetryConfig = {
    schemaVersion: TELEMETRY_CONFIG_SCHEMA_VERSION,
    enabled,
    anonymousId: hasFile ? existing.anonymousId : randomUUID(),
    updatedAt: new Date().toISOString(),
  };

  await writeTelemetryConfig(next);
  return next;
}
