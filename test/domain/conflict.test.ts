import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { executePlan } from "../../src/install/executor.js";
import { WATERMARK } from "../../src/core/markdown.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-conflict-"));
}

describe("executePlan", () => {
  it("creates new files when destination does not exist", async () => {
    const cwd = await tempProject();
    const dest = join(cwd, "AGENTS.md");

    const result = await executePlan([{ dest, content: "# New" }]);

    assert.deepEqual(result.written, [dest]);
    assert.deepEqual(result.skipped, []);

    const { readFile } = await import("node:fs/promises");
    const content = await readFile(dest, "utf8");
    assert.match(content, /# New/);
    assert.ok(content.includes(WATERMARK));
  });

  it("replaces existing files when policy is replace", async () => {
    const cwd = await tempProject();
    const dest = join(cwd, "AGENTS.md");
    await writeFile(dest, "# Old content\n");

    const result = await executePlan(
      [{ dest, content: "# New content" }],
      { policy: { default: "replace" }, cwd },
    );

    assert.deepEqual(result.written, [dest]);
    const { readFile } = await import("node:fs/promises");
    const content = await readFile(dest, "utf8");
    assert.match(content, /# New content/);
    assert.doesNotMatch(content, /Old content/);
  });

  it("appends when policy is append with vorlaxen-first", async () => {
    const cwd = await tempProject();
    const dest = join(cwd, "AGENTS.md");
    await writeFile(dest, "# Old content\n");

    const result = await executePlan(
      [{ dest, content: "# Vorlaxen content" }],
      {
        policy: { default: "append", appendOrder: "vorlaxen-first", overrides: { "AGENTS.md": "append" } },
        cwd,
      },
    );

    assert.deepEqual(result.written, [dest]);
    const { readFile } = await import("node:fs/promises");
    const content = await readFile(dest, "utf8");
    assert.match(content, /# Vorlaxen content/);
    assert.match(content, /# Old content/);
    assert.ok(content.indexOf("# Vorlaxen content") < content.indexOf("# Old content"));
  });

  it("skips existing files when policy is skip", async () => {
    const cwd = await tempProject();
    const dest = join(cwd, "AGENTS.md");
    await writeFile(dest, "# Old content\n");

    const result = await executePlan(
      [{ dest, content: "# New content" }],
      { policy: { default: "skip" }, cwd },
    );

    assert.deepEqual(result.written, []);
    assert.deepEqual(result.skipped, [dest]);

    const { readFile } = await import("node:fs/promises");
    const content = await readFile(dest, "utf8");
    assert.match(content, /Old content/);
  });

  it("dry-run does not write files", async () => {
    const cwd = await tempProject();
    const dest = join(cwd, "AGENTS.md");

    const result = await executePlan(
      [{ dest, content: "# New" }],
      { dryRun: true, cwd },
    );

    assert.deepEqual(result.written, [dest]);
    assert.ok(result.planned);
    assert.equal(result.planned[0]?.action, "create");

    const { stat } = await import("node:fs/promises");
    await assert.rejects(() => stat(dest));
  });
});
