import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { runAdd } from "../../src/commands/add.js";
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

describe("add hub:", () => {
  it("installs via subscribed hub catalog", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "hub-add-"));
    const userDir = await mkdtemp(join(tmpdir(), "hub-user-"));
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

    await runAdd({
      cwd,
      source: "hub:test-hub",
      skillNames: ["demo-skill"],
      yes: true,
      json: true,
    });

    await stat(join(cwd, ".agents", "skills", "demo-skill", "SKILL.md"));
    const lock = JSON.parse(await readFile(join(cwd, "skills-lock.json"), "utf8")) as {
      skills: Record<string, { sourceType: string }>;
    };
    assert.ok(lock.skills["demo-skill"]);

    setUserHubsConfigPathForTests(undefined);
  });
});
