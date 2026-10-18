import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeContent, SECTION_SEPARATOR } from "../../src/install/merge.js";
import { WATERMARK, withWatermark } from "../../src/core/markdown.js";

describe("mergeContent", () => {
  it("places vorlaxen content first when order is vorlaxen-first", () => {
    const merged = mergeContent("# Existing", "# Vorlaxen", "vorlaxen-first");
    assert.equal(merged, `# Vorlaxen${SECTION_SEPARATOR}# Existing`);
  });

  it("places existing content first when order is existing-first", () => {
    const merged = mergeContent("# Existing", "# Vorlaxen", "existing-first");
    assert.equal(merged, `# Existing${SECTION_SEPARATOR}# Vorlaxen`);
  });

  it("strips watermark from existing content before merge", () => {
    const existing = withWatermark("# Existing");
    const merged = mergeContent(existing, "# Vorlaxen", "vorlaxen-first");
    assert.doesNotMatch(merged, new RegExp(WATERMARK));
    assert.match(merged, /# Vorlaxen/);
    assert.match(merged, /# Existing/);
  });

  it("returns incoming when existing is empty", () => {
    assert.equal(mergeContent("", "# New", "existing-first"), "# New");
  });

  it("returns existing when incoming is empty", () => {
    assert.equal(mergeContent("# Old", "", "vorlaxen-first"), "# Old");
  });
});
