import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  catalogEntrySkillName,
  isInsideHubRepoSource,
  normalizeLockSource,
  resolveEntrySourcePath,
  resolveHubSkillInstall,
  sourcesMatch,
} from "../../src/hub/resolve-skill.js";
import { parseSource } from "../../src/source/parse-source.js";
import type { HubSkillEntry, HubSubscription } from "../../src/hub/types.js";

const fixtureRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "hub-catalog",
);

describe("resolve-skill helpers", () => {
  it("catalogEntrySkillName prefers entry.skill over alias", () => {
    const entry: HubSkillEntry = { source: "x", skill: "real-name" };
    assert.equal(catalogEntrySkillName("alias", entry), "real-name");
    assert.equal(catalogEntrySkillName("alias", { source: "x" }), "alias");
  });

  it("normalizeLockSource canonicalizes github shorthand", () => {
    assert.equal(
      normalizeLockSource("https://github.com/org/repo"),
      "org/repo",
    );
    assert.equal(normalizeLockSource("org/repo"), "org/repo");
    assert.equal(normalizeLockSource("./local/path"), "./local/path");
  });

  it("sourcesMatch compares normalized github sources", () => {
    assert.ok(sourcesMatch("org/repo", "https://github.com/org/repo"));
    assert.ok(!sourcesMatch("org/a", "org/b"));
  });

  it("resolveEntrySourcePath resolves relative paths against local hub root", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "hub-resolve-"));
    const sub: HubSubscription = {
      hubId: "test",
      source: fixtureRoot,
      ref: "main",
      manifestPath: "agent-skills.hub.json",
      addedAt: new Date().toISOString(),
    };
    const resolved = resolveEntrySourcePath("../sample-pack", sub, cwd);
    assert.ok(resolved.includes("sample-pack"));
  });

  it("resolveEntrySourcePath maps ./ paths onto a GitHub hub repo", () => {
    const sub: HubSubscription = {
      hubId: "vorlaxen-skills-hub",
      source: "vorlaxen-labs/vorlaxen-skills-hub",
      ref: "main",
      manifestPath: "agent-skills.hub.json",
      addedAt: new Date().toISOString(),
    };
    const resolved = resolveEntrySourcePath("./skills/bar-js", sub, "/tmp/project", "main");
    const parsed = parseSource(resolved, "main");
    assert.equal(parsed.type, "github");
    if (parsed.type !== "github") return;
    assert.equal(parsed.owner, "vorlaxen-labs");
    assert.equal(parsed.repo, "vorlaxen-skills-hub");
    assert.equal(parsed.ref, "main");
    assert.equal(parsed.subpath, "skills/bar-js");
    assert.equal(resolved.includes("/tmp/project"), false);
  });

  it("resolveEntrySourcePath rejects ./ paths that leave a GitHub hub repo", () => {
    const sub: HubSubscription = {
      hubId: "vorlaxen-skills-hub",
      source: "vorlaxen-labs/vorlaxen-skills-hub",
      ref: "main",
      manifestPath: "agent-skills.hub.json",
      addedAt: new Date().toISOString(),
    };
    assert.throws(
      () => resolveEntrySourcePath("./../outside", sub, "/tmp/project", "main"),
      /outside the hub repository/i,
    );
  });

  it("isInsideHubRepoSource accepts in-repo relative paths only", () => {
    assert.equal(isInsideHubRepoSource("./skills/bar-js"), true);
    assert.equal(isInsideHubRepoSource("../sample-pack"), false);
    assert.equal(isInsideHubRepoSource("vorlaxen-labs/vorlaxen-skills-hub"), false);
  });
});

describe("resolveHubSkillInstall", () => {
  it("resolves a hub catalog entry to install coordinates", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "hub-install-resolve-"));
    const sub: HubSubscription = {
      hubId: "test-hub",
      source: fixtureRoot,
      ref: "main",
      manifestPath: "agent-skills.hub.json",
      addedAt: new Date().toISOString(),
    };
    const entry: HubSkillEntry = { source: "../sample-pack" };

    const resolved = await resolveHubSkillInstall({
      cwd,
      alias: "demo-skill",
      entry,
      subscription: sub,
    });

    assert.equal(resolved.skillName, "demo-skill");
    assert.ok(resolved.source);
    assert.equal(resolved.ref, "main");
  });

  it("throws when skill name is missing from source tree", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "hub-install-miss-"));
    const sub: HubSubscription = {
      hubId: "test-hub",
      source: fixtureRoot,
      ref: "main",
      manifestPath: "agent-skills.hub.json",
      addedAt: new Date().toISOString(),
    };
    const entry: HubSkillEntry = {
      source: "../sample-pack",
      skill: "does-not-exist",
    };

    await assert.rejects(
      () =>
        resolveHubSkillInstall({
          cwd,
          alias: "demo-skill",
          entry,
          subscription: sub,
        }),
      /not found/i,
    );
  });
});
