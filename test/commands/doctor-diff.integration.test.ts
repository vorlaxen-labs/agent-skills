import assert from "node:assert/strict";
import { mkdtemp, readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runDoctor } from "../../src/commands/doctor.js";
import { runInit } from "../../src/commands/init.js";
import { comparePlannedToDisk, hasDrift } from "../../src/install/compare-snapshot.js";
import { readInstallManifest } from "../../src/install/manifest.js";
import { planFromManifest } from "../../src/install/run.js";
import { collectDriftPaths } from "../../src/doctor/fix.js";
import { WATERMARK, withWatermark } from "../../src/core/markdown.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-doctor-"));
}

async function captureJson<T>(fn: () => Promise<void>): Promise<T> {
  const logs: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => logs.push(String(args[0]));
  try {
    await fn();
  } finally {
    console.log = original;
  }
  return JSON.parse(logs[0]!) as T;
}

async function plannedDiff(cwd: string) {
  const manifest = await readInstallManifest(cwd);
  const { planned } = await planFromManifest(cwd, manifest);
  return comparePlannedToDisk(planned);
}

describe("doctor drift detection", () => {
  it("doctor passes after fresh install with no drift", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      onConflict: "replace",
      json: true,
    });

    assert.equal(await runDoctor({ cwd, json: true }), 0);

    const files = await plannedDiff(cwd);
    assert.ok(files.every((f) => f.status === "unchanged"));
  });

  it("doctor upstream-drift detects local edits", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      onConflict: "replace",
      json: true,
    });

    const agents = join(cwd, "AGENTS.md");
    await writeFile(agents, withWatermark("# User edited content"));

    const doctorPayload = await captureJson<{ checks: { name: string; status: string }[] }>(
      () => runDoctor({ cwd, json: true }).then(() => {}),
    );
    const upstream = doctorPayload.checks.find((c) => c.name === "upstream-drift");
    assert.equal(upstream?.status, "warn");

    const files = await plannedDiff(cwd);
    assert.equal(files.find((f) => f.dest === agents)?.status, "modify");

    const manifest = await readInstallManifest(cwd);
    const driftPaths = await collectDriftPaths(cwd, manifest);
    assert.ok(driftPaths.includes(agents));
  });

  it("doctor reports missing files when AGENTS.md is deleted", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      onConflict: "replace",
      json: true,
    });

    const agents = join(cwd, "AGENTS.md");
    await unlink(agents);

    assert.equal(await runDoctor({ cwd, json: true }), 1);

    const files = await plannedDiff(cwd);
    assert.equal(files.find((f) => f.dest === agents)?.status, "create");
  });

  it("hasDrift is true when planned files differ from disk", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      onConflict: "replace",
      json: true,
    });

    await writeFile(join(cwd, "AGENTS.md"), "# changed\n");

    const files = await plannedDiff(cwd);
    assert.ok(hasDrift(files));
  });

  it("doctor --strict fails on watermark warnings", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      onConflict: "replace",
      json: true,
    });

    await writeFile(join(cwd, "AGENTS.md"), "# no watermark\n");

    assert.equal(await runDoctor({ cwd, json: true }), 0);
    assert.equal(await runDoctor({ cwd, json: true, strict: true }), 1);
  });

  it("doctor --fix restores drifted watermarked file", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      onConflict: "replace",
      json: true,
    });

    const agents = join(cwd, "AGENTS.md");
    await writeFile(agents, withWatermark("# tampered"));

    assert.equal(await runDoctor({ cwd, fix: true, json: true }), 0);

    const restored = await readFile(agents, "utf8");
    assert.match(restored, /Constrain decisions/);
    assert.ok(restored.includes(WATERMARK));

    const files = await plannedDiff(cwd);
    assert.ok(files.every((f) => f.status === "unchanged"));
  });

  it("comparePlannedToDisk summarizes modify counts for drift", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      onConflict: "replace",
      json: true,
    });

    await writeFile(join(cwd, "AGENTS.md"), withWatermark("# drift"));

    const files = await plannedDiff(cwd);
    assert.equal(files.filter((f) => f.status === "modify").length, 1);
    assert.ok(hasDrift(files));
  });

  it("content-drift detects hash mismatch after install", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      onConflict: "replace",
      json: true,
    });

    const agents = join(cwd, "AGENTS.md");
    await writeFile(agents, withWatermark("# hash drift"));

    const doctorPayload = await captureJson<{ checks: { name: string; status: string }[] }>(
      () => runDoctor({ cwd, json: true }).then(() => {}),
    );
    const contentDrift = doctorPayload.checks.find((c) => c.name === "content-drift");
    assert.equal(contentDrift?.status, "warn");
  });
});
