import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { assignWriteToSkill, buildWrittenBySkill } from "../../src/install/skill-paths.js";
import { SKILLS } from "../../src/core/bundled-catalog.js";

describe("skill-paths", () => {
  it("assigns AGENTS.md to global skill", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "agent-skills-paths-"));
    const dest = join(cwd, "AGENTS.md");
    const owner = assignWriteToSkill(dest, cwd, SKILLS);
    assert.equal(owner, "global");
  });

  it("builds writtenBySkill map", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "agent-skills-paths-"));
    const agents = join(cwd, "AGENTS.md");
    const map = buildWrittenBySkill([agents], cwd, ["global"]);
    assert.deepEqual(map.global, [agents]);
  });
});
