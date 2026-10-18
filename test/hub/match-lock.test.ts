import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  findCatalogMatchesForLockEntry,
  matchLockSkillsToHubs,
} from "../../src/hub/match-lock.js";
import {
  setUserHubsConfigPathForTests,
  upsertHubSubscription,
} from "../../src/hub/config.js";
import type { HubCatalog } from "../../src/hub/types.js";
import type { SkillLockEntry } from "../../src/lock/skills-lock.js";

const fixtureRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "hub-catalog",
);
const olderHubRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "hub-catalog-older",
);
const newerHubRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "hub-catalog-newer",
);

describe("findCatalogMatchesForLockEntry", () => {
  const catalog: HubCatalog = {
    version: 1,
    id: "test-hub",
    skills: {
      "demo-skill": { source: "../sample-pack" },
      alias: { source: "org/repo", skill: "real-skill" },
    },
  };

  it("matches by skill name and normalized source", () => {
    const entry: SkillLockEntry = {
      source: "../sample-pack",
      sourceType: "local",
      skillPath: "skills/demo-skill/SKILL.md",
      computedHash: "abc",
    };
    const match = findCatalogMatchesForLockEntry("demo-skill", entry, "test-hub", catalog);
    assert.equal(match?.alias, "demo-skill");
  });

  it("uses catalog skill override for lock name comparison", () => {
    const entry: SkillLockEntry = {
      source: "org/repo",
      sourceType: "github",
      skillPath: "skills/real-skill/SKILL.md",
      computedHash: "abc",
    };
    const match = findCatalogMatchesForLockEntry("real-skill", entry, "test-hub", catalog);
    assert.equal(match?.alias, "alias");
  });

  it("returns null when source or name differ", () => {
    const entry: SkillLockEntry = {
      source: "other/repo",
      sourceType: "github",
      skillPath: "x",
      computedHash: "abc",
    };
    assert.equal(
      findCatalogMatchesForLockEntry("real-skill", entry, "test-hub", catalog),
      null,
    );
  });
});

describe("matchLockSkillsToHubs", () => {
  it("picks the hub with the newest addedAt when multiple match", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "hub-match-"));
    const userDir = await mkdtemp(join(tmpdir(), "hub-match-user-"));
    setUserHubsConfigPathForTests(join(userDir, "agent-skills-hubs.json"));

    const olderAt = "2026-01-01T00:00:00.000Z";
    const newerAt = "2026-01-10T00:00:00.000Z";

    await upsertHubSubscription({
      cwd,
      project: false,
      subscription: {
        hubId: "older-hub",
        source: olderHubRoot,
        ref: "main",
        manifestPath: "agent-skills.hub.json",
        addedAt: olderAt,
      },
    });

    await upsertHubSubscription({
      cwd,
      project: false,
      subscription: {
        hubId: "newer-hub",
        source: newerHubRoot,
        ref: "main",
        manifestPath: "agent-skills.hub.json",
        addedAt: newerAt,
      },
    });

    const lockSkills: Record<string, SkillLockEntry> = {
      "demo-skill": {
        source: "../sample-pack",
        sourceType: "local",
        skillPath: "skills/demo-skill/SKILL.md",
        computedHash: "deadbeef",
      },
    };

    const subs = [
      {
        hubId: "older-hub",
        source: olderHubRoot,
        ref: "main",
        manifestPath: "agent-skills.hub.json",
        addedAt: olderAt,
      },
      {
        hubId: "newer-hub",
        source: newerHubRoot,
        ref: "main",
        manifestPath: "agent-skills.hub.json",
        addedAt: newerAt,
      },
    ];

    const matched = await matchLockSkillsToHubs({
      cwd,
      subscriptions: subs,
      lockSkills,
      noCache: true,
    });

    assert.equal(matched.get("demo-skill")?.hubId, "newer-hub");
    setUserHubsConfigPathForTests(undefined);
  });
});
