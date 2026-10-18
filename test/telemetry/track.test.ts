import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, afterEach } from "node:test";
import { TELEMETRY_URL } from "../../src/telemetry/client.js";
import {
  setTelemetryConfigPathForTests,
  writeTelemetryConfig,
} from "../../src/telemetry/config.js";
import { resetSessionIdForTests } from "../../src/telemetry/context.js";
import {
  extractCommandProperties,
  resolveTelemetryEnabled,
  trackCommand,
  trackEvent,
} from "../../src/telemetry/track.js";

describe("resolveTelemetryEnabled", () => {
  const original = process.env.VORLAXEN_TELEMETRY;
  let tempDir = "";

  afterEach(async () => {
    setTelemetryConfigPathForTests(undefined);
    resetSessionIdForTests();
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
    if (original === undefined) {
      delete process.env.VORLAXEN_TELEMETRY;
    } else {
      process.env.VORLAXEN_TELEMETRY = original;
    }
  });

  async function useTempConfig(enabled: boolean): Promise<void> {
    tempDir = await mkdtemp(join(tmpdir(), "agent-skills-telemetry-track-"));
    const configPath = join(tempDir, "telemetry.json");
    setTelemetryConfigPathForTests(configPath);
    await writeTelemetryConfig({
      schemaVersion: 1,
      enabled,
      anonymousId: "550e8400-e29b-41d4-a716-446655440000",
      updatedAt: "2026-09-03T00:00:00.000Z",
    });
  }

  it("is enabled by default without config file", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "agent-skills-telemetry-track-"));
    setTelemetryConfigPathForTests(join(tempDir, "missing.json"));
    delete process.env.VORLAXEN_TELEMETRY;
    assert.equal(await resolveTelemetryEnabled(false), true);
  });

  it("respects --no-telemetry flag", async () => {
    await useTempConfig(true);
    assert.equal(await resolveTelemetryEnabled(true), false);
  });

  it("respects VORLAXEN_TELEMETRY env disable", async () => {
    await useTempConfig(true);
    process.env.VORLAXEN_TELEMETRY = "0";
    assert.equal(await resolveTelemetryEnabled(false), false);
  });

  it("respects VORLAXEN_TELEMETRY env force enable over config", async () => {
    await useTempConfig(false);
    process.env.VORLAXEN_TELEMETRY = "1";
    assert.equal(await resolveTelemetryEnabled(false), true);
  });

  it("respects persisted config when env is unset", async () => {
    await useTempConfig(false);
    delete process.env.VORLAXEN_TELEMETRY;
    assert.equal(await resolveTelemetryEnabled(false), false);
  });
});

describe("extractCommandProperties", () => {
  it("extracts install-related fields", () => {
    const props = extractCommandProperties(
      "init",
      {
        platform: "cursor",
        skills: ["global"],
        remote: true,
        dryRun: true,
      },
      [],
    );

    assert.deepEqual(props, {
      platform: "cursor",
      skills_count: 1,
      remote: true,
      dry_run: true,
    });
  });

  it("uses positional args for add/remove skill counts", () => {
    const props = extractCommandProperties("add", {}, [
      "vercel-labs/agent-skills",
      "web-design-guidelines",
    ]);
    assert.equal(props.skills_count, 1);
  });
});

describe("trackEvent", () => {
  const original = process.env.VORLAXEN_TELEMETRY;
  const originalFetch = globalThis.fetch;
  let tempDir = "";

  afterEach(async () => {
    setTelemetryConfigPathForTests(undefined);
    resetSessionIdForTests();
    globalThis.fetch = originalFetch;
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
    if (original === undefined) {
      delete process.env.VORLAXEN_TELEMETRY;
    } else {
      process.env.VORLAXEN_TELEMETRY = original;
    }
  });

  async function useEnabledConfig(): Promise<void> {
    tempDir = await mkdtemp(join(tmpdir(), "agent-skills-telemetry-track-"));
    setTelemetryConfigPathForTests(join(tempDir, "telemetry.json"));
    await writeFile(
      join(tempDir, "telemetry.json"),
      JSON.stringify({
        schemaVersion: 1,
        enabled: true,
        anonymousId: "550e8400-e29b-41d4-a716-446655440000",
        updatedAt: "2026-09-03T00:00:00.000Z",
      }),
    );
  }

  it("does not send when telemetry is disabled", async () => {
    await useEnabledConfig();
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    await trackEvent("cli.command.completed", { command: "list" }, { noTelemetry: true });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(called, false);
  });

  it("does not send when config disables telemetry", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "agent-skills-telemetry-track-"));
    setTelemetryConfigPathForTests(join(tempDir, "telemetry.json"));
    await writeFile(
      join(tempDir, "telemetry.json"),
      JSON.stringify({
        schemaVersion: 1,
        enabled: false,
        anonymousId: "550e8400-e29b-41d4-a716-446655440000",
        updatedAt: "2026-09-03T00:00:00.000Z",
      }),
    );

    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    delete process.env.VORLAXEN_TELEMETRY;
    await trackEvent("cli.command.completed", { command: "list" });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(called, false);
  });

  it("sends event payload with event, properties, and context", async () => {
    await useEnabledConfig();
    delete process.env.VORLAXEN_TELEMETRY;

    let body: unknown;
    globalThis.fetch = (async (_url, init) => {
      body = JSON.parse(String(init?.body));
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    await trackEvent("cli.command.completed", {
      command: "init",
      duration_ms: 100,
      exit_code: 0,
    });

    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(typeof body, "object");
    const event = body as {
      event: string;
      properties: { command: string };
      context: {
        cli: { name: string; version: string };
        runtime: { node_version: string; os: string; distribution: string; arch: string };
        session: { anonymous_id: string };
      };
    };

    assert.equal(event.event, "cli.command.completed");
    assert.equal(event.properties.command, "init");
    assert.equal(event.context.cli.name, "agent-skills");
    assert.match(event.context.runtime.node_version, /^\d+$/);
    assert.equal(
      event.context.session.anonymous_id,
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("trackCommand builds cli.command.completed payload", async () => {
    await useEnabledConfig();
    delete process.env.VORLAXEN_TELEMETRY;

    let url = "";
    let body: unknown;
    globalThis.fetch = (async (requestUrl, init) => {
      url = String(requestUrl);
      body = JSON.parse(String(init?.body));
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    await trackCommand({
      command: "init",
      durationMs: 842,
      exitCode: 0,
      commandOpts: {
        platform: "cursor",
        skills: ["global"],
        remote: false,
      },
      args: [],
    });

    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(url, TELEMETRY_URL);
    const event = body as {
      event: string;
      properties: {
        command: string;
        duration_ms: number;
        exit_code: number;
        platform: string;
        skills_count: number;
      };
    };

    assert.equal(event.event, "cli.command.completed");
    assert.equal(event.properties.command, "init");
    assert.equal(event.properties.duration_ms, 842);
    assert.equal(event.properties.exit_code, 0);
    assert.equal(event.properties.platform, "cursor");
    assert.equal(event.properties.skills_count, 1);
  });
});
