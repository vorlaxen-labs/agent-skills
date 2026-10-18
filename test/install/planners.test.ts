import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { SKILLS } from "../../src/core/bundled-catalog.js";
import { planInstall } from "../../src/install/planners/index.js";
import type { InstallContext } from "../../src/install/types.js";

async function ctxWithGlobal(extraFiles: { path: string; content: string }[] = []): Promise<InstallContext> {
  const cwd = await mkdtemp(join(tmpdir(), "planner-"));
  const files = [
    { relativePath: "AGENTS.md", content: "# Global standards\n" },
    { relativePath: "skills/global/SKILL.md", content: "---\nname: global\n---\n# Global skill\n" },
    { relativePath: "rules/global.mdc", content: "---\ndescription: rule\n---\n# Rule\n" },
    ...extraFiles.map((f) => ({ relativePath: f.path, content: f.content })),
  ];
  return { cwd, skills: SKILLS, files };
}

describe("planInstall", () => {
  it("agents-md merges global body into AGENTS.md", async () => {
    const ctx = await ctxWithGlobal();
    const planned = planInstall("agents-md", ctx);
    assert.equal(planned.length, 1);
    assert.ok(planned[0]!.dest.endsWith("AGENTS.md"));
    assert.match(planned[0]!.content, /Global standards/);
  });

  it("cursor plans rules, agents skills, and cursor skills for global", async () => {
    const ctx = await ctxWithGlobal();
    const planned = planInstall("cursor", ctx);
    const dests = planned.map((p) => p.dest);
    assert.ok(dests.some((d) => d.includes(".cursor/rules/global.mdc")));
    assert.ok(dests.some((d) => d.includes(".agents/skills/global/SKILL.md")));
    assert.ok(dests.some((d) => d.includes(".cursor/skills/global/SKILL.md")));
  });

  it("claude-code writes CLAUDE.md from AGENTS.md", async () => {
    const ctx = await ctxWithGlobal();
    const planned = planInstall("claude-code", ctx);
    const claude = planned.find((p) => p.dest.endsWith("CLAUDE.md"));
    assert.ok(claude);
    assert.match(claude!.content, /Global standards/);
  });

  it("copilot writes .github/copilot-instructions.md", async () => {
    const ctx = await ctxWithGlobal();
    const planned = planInstall("copilot", ctx);
    assert.equal(planned.length, 1);
    assert.ok(planned[0]!.dest.includes("copilot-instructions.md"));
    assert.match(planned[0]!.content, /Global standards/);
  });
});
