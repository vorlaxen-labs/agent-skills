import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  catalogEntrySkillName,
  normalizeLockSource,
  resolveEntrySourcePath,
  resolveHubSkillInstall,
  sourcesMatch,
} from "../../src/hub/resolve-skill.js";
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
