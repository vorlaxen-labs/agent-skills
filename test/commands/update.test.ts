import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runInit } from "../../src/commands/init.js";
import { runUpdate } from "../../src/commands/update.js";
import { WATERMARK } from "../../src/core/markdown.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-update-"));
}

describe("runUpdate", () => {
  it("replaces modified files by default", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      onConflict: "replace",
      json: true,
    });

    const dest = join(cwd, "AGENTS.md");
    await writeFile(dest, "# Old local content\n");

    await runUpdate({ cwd, json: true });

    const content = await readFile(dest, "utf8");
    assert.doesNotMatch(content, /Old local content/);
    assert.match(content, /Constrain decisions/);
    assert.ok(content.includes(WATERMARK));
  });

  it("throws when no manifest exists", async () => {
    const cwd = await tempProject();
    await assert.rejects(() => runUpdate({ cwd, json: true }));
  });
});
