import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { runAdd } from "../../src/commands/add.js";

const fixtureRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "sample-pack",
);

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-add-"));
}

describe("runAdd", () => {
  it("installs a skill from a local source into .agents/skills", async () => {
    const cwd = await tempProject();

    await runAdd({
      cwd,
      source: fixtureRoot,
      skillNames: ["demo-skill"],
      yes: true,
      json: true,
    });

    await stat(join(cwd, ".agents", "skills", "demo-skill", "SKILL.md"));
    const lock = JSON.parse(await readFile(join(cwd, "skills-lock.json"), "utf8")) as {
      skills: Record<string, { sourceType: string; skillPath: string }>;
    };
    assert.ok(lock.skills["demo-skill"]);
    assert.equal(lock.skills["demo-skill"].sourceType, "local");
    assert.match(lock.skills["demo-skill"].skillPath, /demo-skill\/SKILL\.md$/);
  });

  it("dry-run does not write skills or lock", async () => {
    const cwd = await tempProject();
    await runAdd({
      cwd,
      source: fixtureRoot,
      skillNames: ["demo-skill"],
      dryRun: true,
      json: true,
    });
    await assert.rejects(() => stat(join(cwd, ".agents", "skills", "demo-skill", "SKILL.md")));
    await assert.rejects(() => stat(join(cwd, "skills-lock.json")));
  });

  it("throws when requested skill name is missing from source", async () => {
    const cwd = await tempProject();
    await assert.rejects(
      () =>
        runAdd({
          cwd,
          source: fixtureRoot,
          skillNames: ["no-such-skill"],
          yes: true,
        }),
      /not found/i,
    );
  });
});
