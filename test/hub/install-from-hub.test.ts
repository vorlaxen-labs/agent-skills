import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  installFromHub,
  listSubscribedHubIds,
  resolveHubAliasesToInstall,
} from "../../src/hub/install-from-hub.js";
import {
  setUserHubsConfigPathForTests,
  upsertHubSubscription,
} from "../../src/hub/config.js";

const fixtureRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "hub-catalog",
);

async function subscribeTestHub(cwd: string, userDir: string): Promise<void> {
  setUserHubsConfigPathForTests(join(userDir, "agent-skills-hubs.json"));
  await upsertHubSubscription({
    cwd,
    project: false,
    subscription: {
      hubId: "test-hub",
      source: fixtureRoot,
      ref: "main",
      manifestPath: "agent-skills.hub.json",
      addedAt: new Date().toISOString(),
    },
  });
}

describe("install-from-hub", () => {
  it("lists subscribed hub ids", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "hub-list-"));
    const userDir = await mkdtemp(join(tmpdir(), "hub-list-user-"));
    await subscribeTestHub(cwd, userDir);

    const ids = await listSubscribedHubIds(cwd);
    assert.deepEqual(ids, ["test-hub"]);

    setUserHubsConfigPathForTests(undefined);
  });

  it("resolveHubAliasesToInstall maps aliases to install targets", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "hub-resolve-alias-"));
    const userDir = await mkdtemp(join(tmpdir(), "hub-resolve-alias-user-"));
    await subscribeTestHub(cwd, userDir);

    const resolved = await resolveHubAliasesToInstall({
      cwd,
      hubId: "test-hub",
      aliases: ["demo-skill"],
    });

    assert.equal(resolved.length, 1);
    assert.equal(resolved[0]!.alias, "demo-skill");
    assert.equal(resolved[0]!.skillName, "demo-skill");
    assert.ok(resolved[0]!.source);

    setUserHubsConfigPathForTests(undefined);
  });

  it("installFromHub --all installs every catalog skill", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "hub-install-all-"));
    const userDir = await mkdtemp(join(tmpdir(), "hub-install-all-user-"));
    await subscribeTestHub(cwd, userDir);

    const result = await installFromHub({
      cwd,
      hubId: "test-hub",
      all: true,
    });

    assert.deepEqual(result.installed.sort(), ["demo-skill"]);
    const lock = JSON.parse(await readFile(join(cwd, "skills-lock.json"), "utf8")) as {
      skills: Record<string, unknown>;
    };
    assert.ok(lock.skills["demo-skill"]);

    setUserHubsConfigPathForTests(undefined);
  });

  it("throws when hub is not subscribed", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "hub-no-sub-"));
    await assert.rejects(
      () =>
        installFromHub({
          cwd,
          hubId: "missing",
          skillNames: ["demo-skill"],
        }),
      /not subscribed/i,
    );
  });
});
