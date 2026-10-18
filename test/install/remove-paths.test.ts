import assert from "node:assert/strict";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { removePaths } from "../../src/install/remove.js";
import { withWatermark } from "../../src/core/markdown.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-rm-paths-"));
}

describe("removePaths", () => {
  it("removes files that contain the Vorlaxen watermark", async () => {
    const cwd = await tempProject();
    const file = join(cwd, "AGENTS.md");
    await writeFile(file, withWatermark("# Managed\n"));

    const result = await removePaths([file]);
    assert.deepEqual(result.removed, [file]);
    await assert.rejects(() => stat(file));
  });

  it("skips non-watermarked files unless force is set", async () => {
    const cwd = await tempProject();
    const file = join(cwd, "AGENTS.md");
    await writeFile(file, "# User owned\n");

    const skipped = await removePaths([file]);
    assert.deepEqual(skipped.skipped, [file]);
    assert.deepEqual(skipped.removed, []);
    assert.match(await readFile(file, "utf8"), /User owned/);

    const forced = await removePaths([file], { force: true });
    assert.deepEqual(forced.removed, [file]);
  });

  it("dry-run reports removal without deleting", async () => {
    const cwd = await tempProject();
    const file = join(cwd, "AGENTS.md");
    await writeFile(file, withWatermark("# Managed\n"));

    const result = await removePaths([file], { dryRun: true });
    assert.deepEqual(result.removed, [file]);
    await stat(file);
  });

  it("skips missing paths", async () => {
    const cwd = await tempProject();
    const missing = join(cwd, "missing.md");
    const result = await removePaths([missing]);
    assert.deepEqual(result.skipped, [missing]);
  });
});
