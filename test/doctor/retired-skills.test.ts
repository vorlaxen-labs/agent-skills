import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runDoctorChecks, suggestAction } from "../../src/doctor/checks.js";
import type { InstallManifest } from "../../src/install/manifest.js";

describe("retired catalog skills", () => {
  it("warns when the manifest lists ids no longer in the catalog", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "agent-skills-retired-"));
    await mkdir(join(cwd, ".agent-skills"), { recursive: true });
    await writeFile(join(cwd, "AGENTS.md"), "# agents\n");

    const agentsPath = join(cwd, "AGENTS.md");
    const manifest: InstallManifest = {
      schemaVersion: 2,
      cliVersion: "2.0.0",
      platform: "agents-md",
      skills: ["global", "bar-js"],
      remote: null,
      installedAt: "2026-01-01T00:00:00.000Z",
      conflictPolicy: null,
      written: [agentsPath],
      skipped: [],
      writtenBySkill: { global: [agentsPath] },
      contentHashes: {},
    };

    const checks = await runDoctorChecks({ cwd, manifest });
    const skills = checks.find((c) => c.name === "skills");
    assert.ok(skills);
    assert.equal(skills.status, "warn");
    assert.match(skills.message, /bar-js/);
    assert.match(skills.message, /agent-skills remove bar-js/);
    assert.equal(suggestAction(checks), "agent-skills remove bar-js");
  });
});
