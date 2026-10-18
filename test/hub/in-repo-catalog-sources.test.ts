import assert from "node:assert/strict";
import { access, mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, it } from "node:test";
import { runAdd } from "../../src/commands/add.js";
import {
  setUserHubsConfigPathForTests,
  upsertHubSubscription,
} from "../../src/hub/config.js";
import { installFromHub } from "../../src/hub/install-from-hub.js";
import { findCatalogMatchesForLockEntry } from "../../src/hub/match-lock.js";
import { resolveEntrySourcePath, resolveHubSkillInstall } from "../../src/hub/resolve-skill.js";
import { parseSource } from "../../src/source/parse-source.js";
import { mockGithubHubFixture } from "../helpers/mock-github-hub-fixture.js";

const fixtureRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "hub-in-repo-skills",
);

const MOCK_OWNER = "test-org";
const MOCK_REPO = "in-repo-hub";
const MOCK_REF = "main";
const HUB_ID = "in-repo-hub";

function githubSubscription() {
  return {
    hubId: HUB_ID,
    source: `${MOCK_OWNER}/${MOCK_REPO}`,
    ref: MOCK_REF,
    manifestPath: "agent-skills.hub.json",
    addedAt: new Date().toISOString(),
  };
}

describe("hub in-repo catalog sources (./skills/…)", () => {
  let restoreFetch: (() => void) | undefined;

  afterEach(() => {
    restoreFetch?.();
    restoreFetch = undefined;
    setUserHubsConfigPathForTests(undefined);
  });

  it("does not resolve ./skills paths against the project cwd (GitHub hub regression)", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "hub-inrepo-project-"));
    await assert.rejects(
      () => access(join(projectDir, "skills", "bar-js")),
      /ENOENT|no such file/i,
    );

    const resolved = resolveEntrySourcePath(
      "./skills/bar-js",
      githubSubscription(),
      projectDir,
      MOCK_REF,
    );
    assert.equal(parseSource(resolved, MOCK_REF).type, "github");
    assert.equal(resolved.includes(projectDir), false);
  });

  it("installs from a GitHub hub when catalog entries use ./skills/* (empty project tree)", async () => {
    restoreFetch = mockGithubHubFixture({
      fixtureRoot,
      owner: MOCK_OWNER,
      repo: MOCK_REPO,
      ref: MOCK_REF,
    });

    const cwd = await mkdtemp(join(tmpdir(), "hub-inrepo-add-"));
    const userDir = await mkdtemp(join(tmpdir(), "hub-inrepo-user-"));
    setUserHubsConfigPathForTests(join(userDir, "agent-skills-hubs.json"));

    await upsertHubSubscription({
      cwd,
      project: false,
      subscription: githubSubscription(),
    });

    await runAdd({
      cwd,
      source: `hub:${HUB_ID}`,
      skillNames: ["bar-js", "huk-js"],
      yes: true,
      noCache: true,
      json: true,
    });

    await stat(join(cwd, ".agents", "skills", "bar-js", "SKILL.md"));
    await stat(join(cwd, ".agents", "skills", "huk-js", "SKILL.md"));
    await assert.rejects(
      () => stat(join(cwd, "skills", "bar-js", "SKILL.md")),
      /ENOENT|no such file/i,
    );

    const lock = JSON.parse(await readFile(join(cwd, "skills-lock.json"), "utf8")) as {
      skills: Record<
        string,
        { source: string; sourceType: string; skillPath: string; ref?: string }
      >;
    };
    assert.equal(lock.skills["bar-js"]!.sourceType, "github");
    assert.equal(lock.skills["bar-js"]!.source, `${MOCK_OWNER}/${MOCK_REPO}`);
    assert.match(lock.skills["bar-js"]!.skillPath, /skills\/bar-js\/SKILL\.md$/);
    assert.equal(lock.skills["huk-js"]!.source, `${MOCK_OWNER}/${MOCK_REPO}`);
  });

  it("resolveHubSkillInstall returns github lock coordinates for ./skills entries", async () => {
    restoreFetch = mockGithubHubFixture({
      fixtureRoot,
      owner: MOCK_OWNER,
      repo: MOCK_REPO,
      ref: MOCK_REF,
    });

    const cwd = await mkdtemp(join(tmpdir(), "hub-inrepo-resolve-"));
    const resolved = await resolveHubSkillInstall({
      cwd,
      alias: "bar-js",
      entry: { source: "./skills/bar-js" },
      subscription: githubSubscription(),
      noCache: true,
    });

    assert.equal(resolved.skillName, "bar-js");
    assert.equal(resolved.source, `${MOCK_OWNER}/${MOCK_REPO}`);
    assert.equal(resolved.ref, MOCK_REF);
  });

  it("installFromHub --all installs every ./skills/* catalog alias", async () => {
    restoreFetch = mockGithubHubFixture({
      fixtureRoot,
      owner: MOCK_OWNER,
      repo: MOCK_REPO,
      ref: MOCK_REF,
    });

    const cwd = await mkdtemp(join(tmpdir(), "hub-inrepo-all-"));
    const userDir = await mkdtemp(join(tmpdir(), "hub-inrepo-all-user-"));
    setUserHubsConfigPathForTests(join(userDir, "agent-skills-hubs.json"));

    await upsertHubSubscription({
      cwd,
      project: false,
      subscription: githubSubscription(),
    });

    const result = await installFromHub({
      cwd,
      hubId: HUB_ID,
      all: true,
      noCache: true,
    });

    assert.deepEqual(result.installed.sort(), ["bar-js", "huk-js"]);
  });

  it("matches lock rows to in-repo catalog entries via hub repository source", () => {
    const match = findCatalogMatchesForLockEntry(
      "bar-js",
      {
        source: `${MOCK_OWNER}/${MOCK_REPO}`,
        sourceType: "github",
        skillPath: "skills/bar-js/SKILL.md",
        computedHash: "abc",
        ref: MOCK_REF,
      },
      HUB_ID,
      {
        version: 1,
        id: HUB_ID,
        skills: {
          "bar-js": { source: "./skills/bar-js" },
        },
      },
      `${MOCK_OWNER}/${MOCK_REPO}`,
    );
    assert.equal(match?.alias, "bar-js");
  });
});

describe("hub in-repo catalog sources (local hub repo on disk)", () => {
  afterEach(() => {
    setUserHubsConfigPathForTests(undefined);
  });

  it("installs ./skills/* from a local hub checkout into an unrelated project cwd", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "hub-inrepo-local-"));
    const userDir = await mkdtemp(join(tmpdir(), "hub-inrepo-local-user-"));
    setUserHubsConfigPathForTests(join(userDir, "agent-skills-hubs.json"));

    await upsertHubSubscription({
      cwd,
      project: false,
      subscription: {
        hubId: HUB_ID,
        source: fixtureRoot,
        ref: MOCK_REF,
        manifestPath: "agent-skills.hub.json",
        addedAt: new Date().toISOString(),
      },
    });

    await runAdd({
      cwd,
      source: `hub:${HUB_ID}`,
      skillNames: ["bar-js"],
      yes: true,
      json: true,
    });

    await stat(join(cwd, ".agents", "skills", "bar-js", "SKILL.md"));
    await assert.rejects(
      () => stat(join(cwd, "skills", "bar-js", "SKILL.md")),
      /ENOENT|no such file/i,
    );
  });
});
