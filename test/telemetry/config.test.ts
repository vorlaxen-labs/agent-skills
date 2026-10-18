import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, it } from "node:test";
import {
  getTelemetryConfigPath,
  readTelemetryConfig,
  setTelemetryConfigPathForTests,
  setTelemetryEnabled,
  writeTelemetryConfig,
} from "../../src/telemetry/config.js";
import { pathExists } from "../../src/core/fs.js";

describe("telemetry config", () => {
  let tempDir = "";

  afterEach(async () => {
    setTelemetryConfigPathForTests(undefined);
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  async function useTempConfig(): Promise<string> {
    tempDir = await mkdtemp(join(tmpdir(), "agent-skills-telemetry-config-"));
    const configPath = join(tempDir, "telemetry.json");
    setTelemetryConfigPathForTests(configPath);
    return configPath;
  }

  it("defaults to enabled when config file is missing", async () => {
    await useTempConfig();
    const config = await readTelemetryConfig();
    assert.equal(config.enabled, true);
    assert.match(config.anonymousId, /^[0-9a-f-]{36}$/i);
  });

  it("persists disabled preference", async () => {
    const configPath = await useTempConfig();
    const saved = await setTelemetryEnabled(false);

    assert.equal(saved.enabled, false);
    assert.equal(await pathExists(configPath), true);

    const loaded = await readTelemetryConfig();
    assert.equal(loaded.enabled, false);
    assert.equal(loaded.anonymousId, saved.anonymousId);
  });

  it("re-enables telemetry and keeps anonymous id", async () => {
    await useTempConfig();
    const disabled = await setTelemetryEnabled(false);
    const enabled = await setTelemetryEnabled(true);

    assert.equal(enabled.enabled, true);
    assert.equal(enabled.anonymousId, disabled.anonymousId);
  });

  it("writes valid JSON to the configured path", async () => {
    const configPath = await useTempConfig();
    await writeTelemetryConfig({
      schemaVersion: 1,
      enabled: true,
      anonymousId: "550e8400-e29b-41d4-a716-446655440000",
      updatedAt: "2026-09-03T00:00:00.000Z",
    });

    assert.equal(getTelemetryConfigPath(), configPath);
    const loaded = await readTelemetryConfig();
    assert.equal(loaded.enabled, true);
    assert.equal(loaded.anonymousId, "550e8400-e29b-41d4-a716-446655440000");
  });
});
