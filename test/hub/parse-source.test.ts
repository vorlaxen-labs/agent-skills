import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatGithubSource, parseSource } from "../../src/source/parse-source.js";

describe("parseSource", () => {
  it("parses hub: prefix", () => {
    const p = parseSource("hub:vorlaxen-skills-hub");
    assert.equal(p.type, "hub");
    if (p.type === "hub") {
      assert.equal(p.hubId, "vorlaxen-skills-hub");
    }
  });

  it("parses local paths", () => {
    assert.deepEqual(parseSource("./skills"), { type: "local", path: "./skills" });
    assert.deepEqual(parseSource("/abs/path"), { type: "local", path: "/abs/path" });
  });

  it("parses owner/repo shorthand with default ref", () => {
    const p = parseSource("acme/pkg");
    assert.equal(p.type, "github");
    if (p.type === "github") {
      assert.equal(p.owner, "acme");
      assert.equal(p.repo, "pkg");
      assert.equal(p.ref, "main");
    }
  });

  it("parses GitHub HTTPS URLs with tree ref and subpath", () => {
    const p = parseSource("https://github.com/org/repo/tree/v1.2.3/skills/foo");
    assert.equal(p.type, "github");
    if (p.type === "github") {
      assert.equal(p.ref, "v1.2.3");
      assert.equal(p.subpath, "skills/foo");
    }
  });

  it("throws on empty or unrecognized input", () => {
    assert.throws(() => parseSource(""), /required/i);
    assert.throws(() => parseSource("not-a-valid-source"), /Unrecognized/i);
  });

  it("formatGithubSource returns owner/repo", () => {
    assert.equal(formatGithubSource("org", "repo"), "org/repo");
  });
});
