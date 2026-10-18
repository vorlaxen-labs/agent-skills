import assert from "node:assert/strict";
import { mkdtemp, readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runDiff } from "../../src/commands/diff.js";
import { runDoctor } from "../../src/commands/doctor.js";
import { runInit } from "../../src/commands/init.js";
import { runStatus } from "../../src/commands/status.js";
import { comparePlannedToDisk, hasDrift } from "../../src/install/compare-snapshot.js";
import { readInstallManifest } from "../../src/install/manifest.js";
import { planFromManifest } from "../../src/install/run.js";
import { collectDriftPaths } from "../../src/doctor/fix.js";
import { WATERMARK, withWatermark } from "../../src/core/markdown.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-doctor-diff-"));
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

describe("doctor/diff consistency", () => {
  it("doctor and diff agree after fresh install", async () => {
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

    const diffPayload = await captureJson<{ files: { status: string }[] }>(() =>
      runDiff({ cwd, json: true }).then(() => {}),
    );
    assert.ok(diffPayload.files.every((f) => f.status === "unchanged"));
  });

  it("doctor upstream-drift and diff both detect local edits", async () => {
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

    const diffPayload = await captureJson<{ files: { dest: string; status: string }[] }>(
      () => runDiff({ cwd, json: true }).then(() => {}),
    );
    assert.equal(diffPayload.files.find((f) => f.dest === agents)?.status, "modify");

    const manifest = await readInstallManifest(cwd);
    const driftPaths = await collectDriftPaths(cwd, manifest);
    assert.ok(driftPaths.includes(agents));
  });

  it("doctor reports missing files; diff reports create", async () => {
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

    const diffPayload = await captureJson<{ files: { dest: string; status: string }[] }>(
      () => runDiff({ cwd, json: true }).then(() => {}),
    );
    assert.equal(diffPayload.files.find((f) => f.dest === agents)?.status, "create");
  });

  it("diff --check exits 1 when drift exists", async () => {
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

    const code = await runDiff({ cwd, json: true, check: true });
    assert.equal(code, 1);
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
    assert.equal(await runDiff({ cwd, json: true, check: true }), 0);
  });

  it("status diff summary matches comparePlannedToDisk", async () => {
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

    const statusPayload = await captureJson<{
      diff: { unchanged: number; modify: number; create: number };
    }>(() => runStatus({ cwd, json: true }));

    const manifest = await readInstallManifest(cwd);
    const { planned } = await planFromManifest(cwd, manifest);
    const files = await comparePlannedToDisk(planned);

    assert.equal(statusPayload.diff.modify, files.filter((f) => f.status === "modify").length);
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
