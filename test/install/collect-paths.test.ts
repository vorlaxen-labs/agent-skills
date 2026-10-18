import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectPaths } from "../../src/install/collect-paths.js";

describe("collectPaths", () => {
  it("returns bundled paths for known skill ids", () => {
    const paths = collectPaths(["global"]);
    assert.ok(paths.includes("AGENTS.md"));
    assert.ok(paths.includes("skills/global"));
    assert.ok(paths.includes("rules/global.mdc"));
  });

  it("deduplicates when the same skill is listed twice", () => {
    const once = collectPaths(["global"]);
    const twice = collectPaths(["global", "global"]);
    assert.deepEqual([...once].sort(), [...twice].sort());
  });

  it("returns empty for unknown ids", () => {
    assert.deepEqual(collectPaths(["not-a-skill"]), []);
  });
});
