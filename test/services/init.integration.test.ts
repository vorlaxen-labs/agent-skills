import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runInit } from "../../src/commands/init.js";
import { WATERMARK } from "../../src/core/markdown.js";
import { ValidationError } from "../../src/core/validate.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-test-"));
}

describe("runInit integration", () => {
  it("rejects unknown platform before writing files", async () => {
    const cwd = await tempProject();
    await assert.rejects(
      () =>
        runInit({
          cwd,
          platform: "haciabi",
          skills: ["global"],
        }),
      (err: unknown) => {
        assert.ok(err instanceof ValidationError);
        assert.match((err as ValidationError).message, /Unknown platform/);
        return true;
      },
    );
    await assert.rejects(() => stat(join(cwd, "AGENTS.md")));
  });

  it("rejects unknown skill ids", async () => {
    const cwd = await tempProject();
    await assert.rejects(
      () =>
        runInit({
          cwd,
          platform: "agents-md",
          skills: ["osman"],
        }),
      (err: unknown) => {
        assert.ok(err instanceof ValidationError);
        assert.match((err as ValidationError).message, /Unknown skill/);
        return true;
      },
    );
    await assert.rejects(() => stat(join(cwd, "AGENTS.md")));
  });

  it("installs AGENTS.md from bundled snapshot", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      json: true,
    });

    const content = await readFile(join(cwd, "AGENTS.md"), "utf8");
    assert.match(content, /Constrain decisions, not implementations/);
    assert.ok(content.includes(WATERMARK));
  });

  it("installs Cursor skill tree from bundled snapshot", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "cursor",
      skills: ["global"],
      json: true,
    });

    await stat(join(cwd, ".cursor", "rules", "global.mdc"));
    await stat(join(cwd, ".cursor", "skills", "global", "SKILL.md"));
    await stat(join(cwd, ".agents", "skills", "global", "SKILL.md"));

    const skill = await readFile(
      join(cwd, ".cursor", "skills", "global", "SKILL.md"),
      "utf8",
    );
    assert.match(skill, /global/);
    assert.ok(skill.includes(WATERMARK));
  });

  it("appends to existing AGENTS.md with --yes (vorlaxen-first)", async () => {
    const cwd = await tempProject();
    const dest = join(cwd, "AGENTS.md");
    const { writeFile } = await import("node:fs/promises");
    await writeFile(dest, "# Old content\n");

    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      json: true,
    });

    const content = await readFile(dest, "utf8");
    assert.match(content, /Old content/);
    assert.match(content, /Constrain decisions, not implementations/);
    assert.ok(
      content.indexOf("Constrain decisions") < content.indexOf("Old content"),
    );
  });

  it("replaces existing AGENTS.md when --on-conflict replace", async () => {
    const cwd = await tempProject();
    const dest = join(cwd, "AGENTS.md");
    const { writeFile } = await import("node:fs/promises");
    await writeFile(dest, "# Old content\n");

    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      onConflict: "replace",
      json: true,
    });

    const content = await readFile(dest, "utf8");
    assert.doesNotMatch(content, /Old content/);
    assert.match(content, /Constrain decisions, not implementations/);
  });

  it("skips existing AGENTS.md when --on-conflict skip", async () => {
    const cwd = await tempProject();
    const dest = join(cwd, "AGENTS.md");
    const { writeFile } = await import("node:fs/promises");
    await writeFile(dest, "# Old content\n");

    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      onConflict: "skip",
      json: true,
    });

    const content = await readFile(dest, "utf8");
    assert.match(content, /Old content/);
    assert.doesNotMatch(content, /Constrain decisions/);
  });

  it("dry-run does not write files", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      dryRun: true,
      json: true,
    });

    await assert.rejects(() => stat(join(cwd, "AGENTS.md")));
  });

  it("writes install manifest after successful init", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      json: true,
    });

    const manifestPath = join(cwd, ".agent-skills", "manifest.json");
    await stat(manifestPath);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      platform: string;
      skills: string[];
      written: string[];
    };
    assert.equal(manifest.platform, "agents-md");
    assert.deepEqual(manifest.skills, ["global"]);
    assert.ok(manifest.written.length > 0);
  });

});
