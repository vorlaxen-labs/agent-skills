import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSkillFrontmatter } from "../../src/discovery/frontmatter.js";

function skillMd(body: { name: string; description?: string }): string {
  const lines = ["---", `name: ${body.name}`];
  if (body.description !== undefined) {
    lines.push(`description: ${body.description}`);
  }
  lines.push("---", "", "# Skill");
  return lines.join("\n");
}

describe("parseSkillFrontmatter", () => {
  it("returns null when frontmatter is missing", () => {
    assert.equal(parseSkillFrontmatter("# No frontmatter"), null);
    assert.equal(parseSkillFrontmatter("---\nname: x\n"), null);
  });

  it("parses name and description", () => {
    const fm = parseSkillFrontmatter(
      skillMd({ name: "my-skill", description: "Does things" }),
    );
    assert.deepEqual(fm, { name: "my-skill", description: "Does things" });
  });

  it("strips quotes around name", () => {
    const content = "---\nname: \"quoted-name\"\n---\n";
    assert.deepEqual(parseSkillFrontmatter(content)?.name, "quoted-name");
  });

  it("returns null when name is absent", () => {
    assert.equal(parseSkillFrontmatter("---\ndescription: only\n---\n"), null);
  });

  it("supports multiline description values", () => {
    const content = "---\nname: x\ndescription: line one\n  continued\n---\n";
    const fm = parseSkillFrontmatter(content);
    assert.equal(fm?.name, "x");
    assert.ok(fm?.description?.includes("line one"));
  });
});
