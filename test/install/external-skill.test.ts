import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  installExternalSkills,
  removeExternalSkills,
} from "../../src/install/external-skill.js";
import { runInit } from "../../src/commands/init.js";

const fixtureRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "sample-pack",
);

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "external-skill-"));
}

describe("installExternalSkills", () => {
  it("installs all discovered skills when names are omitted", async () => {
    const cwd = await tempProject();
    const result = await installExternalSkills({ cwd, source: fixtureRoot });
    assert.deepEqual(result.installed.sort(), ["demo-skill", "second-skill"]);
    await stat(join(cwd, ".agents", "skills", "demo-skill", "SKILL.md"));
    await stat(join(cwd, ".agents", "skills", "second-skill", "SKILL.md"));
  });

  it("filters by skillNames and errors on missing names", async () => {
    const cwd = await tempProject();
    const one = await installExternalSkills({
      cwd,
      source: fixtureRoot,
      skillNames: ["demo-skill"],
    });
    assert.deepEqual(one.installed, ["demo-skill"]);

    await assert.rejects(
      () =>
        installExternalSkills({
          cwd,
          source: fixtureRoot,
          skillNames: ["missing-skill"],
        }),
      /not found/i,
    );
  });

  it("skips skills already present in lock unless force", async () => {
    const cwd = await tempProject();
    await installExternalSkills({ cwd, source: fixtureRoot, skillNames: ["demo-skill"] });
    const again = await installExternalSkills({
      cwd,
      source: fixtureRoot,
      skillNames: ["demo-skill"],
    });
    assert.deepEqual(again.skipped, ["demo-skill"]);
    assert.deepEqual(again.installed, []);

    const forced = await installExternalSkills({
      cwd,
      source: fixtureRoot,
      skillNames: ["demo-skill"],
      force: true,
    });
    assert.deepEqual(forced.installed, ["demo-skill"]);
  });

  it("dry-run does not write lock or files", async () => {
    const cwd = await tempProject();
    const result = await installExternalSkills({
      cwd,
      source: fixtureRoot,
      skillNames: ["demo-skill"],
      dryRun: true,
    });
    assert.deepEqual(result.installed, ["demo-skill"]);
    assert.equal(result.lockPath, undefined);
    await assert.rejects(() => stat(join(cwd, "skills-lock.json")));
  });

  it("mirrors into .cursor/skills when manifest platform is cursor", async () => {
    const cwd = await tempProject();
    await runInit({ cwd, platform: "cursor", skills: ["global"], yes: true });
    await installExternalSkills({
      cwd,
      source: fixtureRoot,
      skillNames: ["demo-skill"],
    });
    await stat(join(cwd, ".cursor", "skills", "demo-skill", "SKILL.md"));
  });

  it("throws when source has no SKILL.md", async () => {
    const cwd = await tempProject();
    const empty = await mkdtemp(join(tmpdir(), "external-empty-"));
    await assert.rejects(
      () => installExternalSkills({ cwd, source: empty }),
      /No skills/i,
    );
  });
});

describe("removeExternalSkills", () => {
  it("removes installed skills from disk and lock", async () => {
    const cwd = await tempProject();
    await installExternalSkills({
      cwd,
      source: fixtureRoot,
      skillNames: ["demo-skill"],
    });
    const removed = await removeExternalSkills(cwd, ["demo-skill"]);
    assert.deepEqual(removed, ["demo-skill"]);
    await assert.rejects(() => stat(join(cwd, ".agents", "skills", "demo-skill", "SKILL.md")));
    const lock = JSON.parse(await readFile(join(cwd, "skills-lock.json"), "utf8")) as {
      skills: Record<string, unknown>;
    };
    assert.equal(lock.skills["demo-skill"], undefined);
  });
});
