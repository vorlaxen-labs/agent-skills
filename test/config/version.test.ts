import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPackageVersion } from "../../src/core/version.js";

describe("getPackageVersion", () => {
  it("reads version from package.json", () => {
    assert.match(getPackageVersion(), /^\d+\.\d+\.\d+/);
  });
});
