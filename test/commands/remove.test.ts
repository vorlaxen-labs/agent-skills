import assert from "node:assert/strict";
import { mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { runAdd } from "../../src/commands/add.js";
import { runRemove } from "../../src/commands/remove.js";
import { runInit } from "../../src/commands/init.js";

const fixtureRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "sample-pack",
);

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-remove-"));
}

describe("runRemove", () => {
  it("removes an integrated skill from lock and disk", async () => {
    const cwd = await tempProject();
    await runAdd({
      cwd,
      source: fixtureRoot,
      skillNames: ["demo-skill"],
      yes: true,
    });

    await runRemove({
      cwd,
      skillIds: ["demo-skill"],
      yes: true,
    });

    await assert.rejects(() =>
      stat(join(cwd, ".agents", "skills", "demo-skill", "SKILL.md")),
    );
  });

  it("removes bundled global from manifest install", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
    });

    await runRemove({
      cwd,
      skillIds: ["global"],
      yes: true,
      force: true,
    });
  });
});
