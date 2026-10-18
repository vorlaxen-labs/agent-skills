import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WATERMARK,
  stripFrontmatter,
  stripWatermark,
  withWatermark,
} from "../../src/core/markdown.js";

describe("markdown helpers", () => {
  it("withWatermark appends watermark once", () => {
    const out = withWatermark("# Title\n");
    assert.ok(out.includes(WATERMARK));
    assert.match(out, /# Title/);
  });

  it("stripWatermark removes watermark and trailing whitespace", () => {
    const wrapped = withWatermark("body");
    assert.equal(stripWatermark(wrapped), "body");
    assert.equal(stripWatermark(`${wrapped}\n\n${WATERMARK}\n`), "body");
  });

  it("stripFrontmatter removes YAML block", () => {
    const raw = "---\nname: x\n---\n\n# Body\n";
    assert.equal(stripFrontmatter(raw), "\n# Body\n");
  });

  it("stripFrontmatter leaves content without frontmatter unchanged", () => {
    const raw = "# No frontmatter\n";
    assert.equal(stripFrontmatter(raw), raw);
  });

  it("stripFrontmatter leaves malformed frontmatter unchanged", () => {
    const raw = "---\nname: x\n";
    assert.equal(stripFrontmatter(raw), raw);
  });
});
