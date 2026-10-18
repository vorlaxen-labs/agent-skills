import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { discoverSkillsFromFileList } from "../../src/discovery/discover.js";

function md(name: string): string {
  return `---\nname: ${name}\n---\n# ${name}\n`;
}

describe("discoverSkillsFromFileList", () => {
  it("discovers a repo-root SKILL.md", () => {
    const found = discoverSkillsFromFileList([
      { relativePath: "SKILL.md", content: md("root-skill") },
      { relativePath: "README.md", content: "ignore" },
    ]);
    assert.equal(found.length, 1);
    assert.equal(found[0]!.name, "root-skill");
    assert.ok(found[0]!.files.has("SKILL.md"));
    assert.ok(found[0]!.files.has("README.md"));
  });

  it("discovers skills under skills/ and collects sibling files", () => {
    const found = discoverSkillsFromFileList([
      { relativePath: "skills/demo/SKILL.md", content: md("demo") },
      { relativePath: "skills/demo/scripts/run.sh", content: "#!/bin/sh\n" },
    ]);
    assert.equal(found[0]!.skillPath, "skills/demo/SKILL.md");
    assert.equal(found[0]!.files.get("SKILL.md"), md("demo"));
    assert.ok(found[0]!.files.has("scripts/run.sh"));
  });

  it("normalizes Windows-style paths", () => {
    const found = discoverSkillsFromFileList([
      { relativePath: "skills\\win\\SKILL.md", content: md("win-skill") },
    ]);
    assert.equal(found[0]!.name, "win-skill");
  });

  it("skips SKILL.md without valid frontmatter name", () => {
    const found = discoverSkillsFromFileList([
      { relativePath: "skills/bad/SKILL.md", content: "# no frontmatter" },
    ]);
    assert.equal(found.length, 0);
  });

  it("omits files under skipped directories from the skill file map", () => {
    const found = discoverSkillsFromFileList([
      { relativePath: "skills/ok/SKILL.md", content: md("ok") },
      { relativePath: "skills/ok/node_modules/pkg/tool.js", content: "ignored" },
      { relativePath: "skills/ok/lib/util.js", content: "keep" },
    ]);
    assert.equal(found.length, 1);
    assert.equal(found[0]!.name, "ok");
    assert.ok(found[0]!.files.has("lib/util.js"));
    assert.ok(!found[0]!.files.has("node_modules/pkg/tool.js"));
  });

  it("deduplicates by frontmatter name (last wins)", () => {
    const found = discoverSkillsFromFileList([
      { relativePath: "skills/a/SKILL.md", content: md("dup") },
      { relativePath: "skills/b/SKILL.md", content: md("dup") },
    ]);
    assert.equal(found.length, 1);
    assert.equal(found[0]!.skillPath, "skills/b/SKILL.md");
  });

  it("rejects deeply nested skills/ paths beyond allowed depth", () => {
    const deep = "skills/a/b/c/d/e/SKILL.md";
    const found = discoverSkillsFromFileList([
      { relativePath: deep, content: md("too-deep") },
    ]);
    assert.equal(found.length, 0);
  });

  it("allows .agents/skills/ layout", () => {
    const found = discoverSkillsFromFileList([
      {
        relativePath: ".agents/skills/pkg/SKILL.md",
        content: md("agents-layout"),
      },
    ]);
    assert.equal(found[0]!.name, "agents-layout");
  });

  it("sorts results by skill name", () => {
    const found = discoverSkillsFromFileList([
      { relativePath: "skills/z/SKILL.md", content: md("z-skill") },
      { relativePath: "skills/a/SKILL.md", content: md("a-skill") },
    ]);
    assert.deepEqual(
      found.map((s) => s.name),
      ["a-skill", "z-skill"],
    );
  });
});
