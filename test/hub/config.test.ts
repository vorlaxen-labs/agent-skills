import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  readMergedHubSubscriptions,
  setUserHubsConfigPathForTests,
  upsertHubSubscription,
} from "../../src/hub/config.js";

describe("hub config", () => {
  it("merges project over user by hubId", async () => {
    const userDir = await mkdtemp(join(tmpdir(), "hub-user-"));
    const project = await mkdtemp(join(tmpdir(), "hub-proj-"));
    setUserHubsConfigPathForTests(join(userDir, "agent-skills-hubs.json"));

    await upsertHubSubscription({
      cwd: project,
      project: false,
      subscription: {
        hubId: "a",
        source: "org/a",
        ref: "main",
        manifestPath: "agent-skills.hub.json",
        addedAt: "2026-01-01T00:00:00.000Z",
      },
    });

    await upsertHubSubscription({
      cwd: project,
      project: true,
      subscription: {
        hubId: "a",
        source: "org/a-fork",
        ref: "dev",
        manifestPath: "agent-skills.hub.json",
        addedAt: "2026-01-02T00:00:00.000Z",
      },
    });

    const merged = await readMergedHubSubscriptions(project);
    assert.equal(merged.length, 1);
    assert.equal(merged[0]!.source, "org/a-fork");
    assert.equal(merged[0]!.ref, "dev");

    setUserHubsConfigPathForTests(undefined);
  });
});
