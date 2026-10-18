import { readFileSync } from "node:fs";
import { arch, platform } from "node:os";
import { randomUUID } from "node:crypto";
import { readTelemetryConfig } from "./config.js";
import { getPackageVersion } from "../core/version.js";
import type {
  TelemetryCliContext,
  TelemetryContext,
  TelemetryRuntimeContext,
  TelemetrySessionContext,
} from "./types.js";

const CLI_NAME = "agent-skills";

let sessionId: string | undefined;
let sessionIdFromConfig: string | undefined;

export function getSessionId(): string {
  if (sessionId !== undefined) {
    return sessionId;
  }
  if (sessionIdFromConfig !== undefined) {
    sessionId = sessionIdFromConfig;
    return sessionId;
  }
  sessionId = randomUUID();
  return sessionId;
}

export async function loadSessionIdFromConfig(): Promise<void> {
  const config = await readTelemetryConfig();
  sessionIdFromConfig = config.anonymousId;
  if (sessionId === undefined) {
    sessionId = config.anonymousId;
  }
}

export function resetSessionIdForTests(): void {
  sessionId = undefined;
  sessionIdFromConfig = undefined;
}

export function getNodeMajorVersion(version = process.version): string {
  const match = version.match(/^v(\d+)/);
  return match?.[1] ?? version.replace(/^v/, "");
}

export function getDistribution(osPlatform = platform()): string {
  if (osPlatform === "linux") {
    try {
      const content = readFileSync("/etc/os-release", "utf8");
      const match = content.match(/^ID=(.+)$/m);
      if (match) {
        return match[1]!.replace(/^"|"$/g, "");
      }
    } catch {
      // fall through
    }
  }
  if (osPlatform === "darwin") {
    return "macos";
  }
  if (osPlatform === "win32") {
    return "windows";
  }
  return osPlatform;
}

export function getRuntimeContext(): TelemetryRuntimeContext {
  const osPlatform = platform();
  return {
    node_version: getNodeMajorVersion(),
    os: osPlatform,
    distribution: getDistribution(osPlatform),
    arch: arch(),
  };
}

export function getCliContext(): TelemetryCliContext {
  return {
    name: CLI_NAME,
    version: getPackageVersion(),
  };
}

export function getSessionContext(): TelemetrySessionContext {
  return {
    anonymous_id: getSessionId(),
  };
}

export function buildTelemetryContext(): TelemetryContext {
  return {
    cli: getCliContext(),
    runtime: getRuntimeContext(),
    session: getSessionContext(),
  };
}
