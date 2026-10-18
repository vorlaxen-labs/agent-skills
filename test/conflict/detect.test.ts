import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { detectConflicts } from "../../src/conflict/detect.js";
import { WATERMARK, withWatermark } from "../../src/core/markdown.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-detect-"));
}

describe("detectConflicts", () => {
  it("returns empty when destination files do not exist", async () => {
    const cwd = await tempProject();
    const conflicts = await detectConflicts([
      { dest: join(cwd, "AGENTS.md"), content: "# New" },
    ]);
    assert.deepEqual(conflicts, []);
  });

  it("ignores identical content modulo watermark", async () => {
    const cwd = await tempProject();
    const dest = join(cwd, "AGENTS.md");
    await writeFile(dest, withWatermark("# Same\n"));

    const conflicts = await detectConflicts([
      { dest, content: "# Same\n" },
    ]);
    assert.deepEqual(conflicts, []);
  });

  it("reports paths when content differs", async () => {
    const cwd = await tempProject();
    const dest = join(cwd, "AGENTS.md");
    await writeFile(dest, withWatermark("# Old\n"));

    const conflicts = await detectConflicts([
      { dest, content: "# New\n" },
    ]);
    assert.deepEqual(conflicts, [dest]);
  });

  it("treats watermark-only differences as no conflict", async () => {
    const cwd = await tempProject();
    const dest = join(cwd, "AGENTS.md");
    await writeFile(dest, "# Body\n");

    const conflicts = await detectConflicts([
      { dest, content: withWatermark("# Body\n") },
    ]);
    assert.deepEqual(conflicts, []);
  });
});
