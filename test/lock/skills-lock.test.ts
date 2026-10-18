import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  SkillsLockError,
  getSkillsLockPath,
  hashSkillFolder,
  mergeLockEntry,
  readSkillsLock,
  removeLockSkills,
  writeSkillsLock,
  type SkillLockEntry,
} from "../../src/lock/skills-lock.js";

const sampleEntry = (): SkillLockEntry => ({
  source: "org/repo",
  sourceType: "github",
  skillPath: "skills/demo/SKILL.md",
  computedHash: "abc123",
  ref: "main",
});

describe("skills-lock", () => {
  it("readSkillsLock returns empty skills when file is missing", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "lock-missing-"));
    const lock = await readSkillsLock(cwd);
    assert.equal(lock.version, 1);
    assert.deepEqual(lock.skills, {});
  });

  it("writeSkillsLock sorts skill keys and embeds schema", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "lock-write-"));
    await writeSkillsLock(cwd, {
      version: 1,
      skills: { z: sampleEntry(), a: sampleEntry() },
    });
    const raw = JSON.parse(await readFile(getSkillsLockPath(cwd), "utf8")) as {
      skills: Record<string, unknown>;
      $schema?: string;
    };
    assert.deepEqual(Object.keys(raw.skills), ["a", "z"]);
    assert.ok(raw.$schema?.includes("skills-lock"));
  });

  it("mergeLockEntry and removeLockSkills update entries", () => {
    const base = { version: 1, skills: { a: sampleEntry() } };
    const merged = mergeLockEntry(base, "b", sampleEntry());
    assert.ok(merged.skills.b);
    const trimmed = removeLockSkills(merged, ["a"]);
    assert.deepEqual(Object.keys(trimmed.skills), ["b"]);
  });

  it("hashSkillFolder is stable for key order", () => {
    const a = new Map([
      ["b.txt", "2"],
      ["a.txt", "1"],
    ]);
    const b = new Map([
      ["a.txt", "1"],
      ["b.txt", "2"],
    ]);
    assert.equal(hashSkillFolder(a), hashSkillFolder(b));
  });

  it("readSkillsLock rejects invalid JSON", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "lock-bad-"));
    await writeFile(getSkillsLockPath(cwd), "{ not json");
    await assert.rejects(() => readSkillsLock(cwd), SkillsLockError);
  });

  it("readSkillsLock rejects malformed entries", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "lock-malformed-"));
    await writeFile(
      getSkillsLockPath(cwd),
      JSON.stringify({ version: 1, skills: { bad: { source: 1 } } }),
    );
    await assert.rejects(() => readSkillsLock(cwd), SkillsLockError);
  });
});
