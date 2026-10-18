import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultHubRepoSource } from "../../src/hub/constants.js";
import { resolveHubAddInput } from "../../src/hub/resolve-input.js";

describe("resolveHubAddInput", () => {
  it("throws on empty input", () => {
    assert.throws(() => resolveHubAddInput("   "), /required/i);
  });

  it("passes through GitHub shorthand sources", () => {
    const r = resolveHubAddInput("acme/skills-repo");
    assert.equal(r.source, "acme/skills-repo");
    assert.equal(r.hubIdHint, undefined);
  });

  it("passes through local and https GitHub URLs", () => {
    assert.equal(resolveHubAddInput("./my-hub").source, "./my-hub");
    assert.match(
      resolveHubAddInput("https://github.com/org/repo/tree/main/path").source,
      /github\.com/,
    );
  });

  it("maps bare hub id to default org repo source", () => {
    const hubId = "my-custom-hub";
    const r = resolveHubAddInput(hubId);
    assert.equal(r.source, defaultHubRepoSource(hubId));
    assert.equal(r.hubIdHint, hubId);
  });
});
