import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  buildManifest,
  defaultConflictPolicy,
  MANIFEST_SCHEMA_VERSION,
  writeInstallManifest,
} from "../../src/install/manifest.js";
import { writeSkillsLock } from "../../src/lock/skills-lock.js";
import { INSTALL_MANIFEST_V3_SCHEMA_URL } from "../../src/schemas/public-urls.js";
import { SKILLS_LOCK_V1_SCHEMA_URL } from "../../src/schemas/public-urls.js";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";

const schemaRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "docs", "schemas");

describe("JSON schemas", () => {
  it("schema files parse as JSON", async () => {
    const names = [
      "install-manifest-v3.schema.json",
      "skills-lock-v1.schema.json",
      "install-manifest-legacy.schema.json",
    ];
    for (const name of names) {
      const raw = await readFile(join(schemaRoot, name), "utf8");
      const parsed = JSON.parse(raw) as { $id?: string; required?: string[] };
      assert.ok(parsed.$id?.includes(name), `$id should reference ${name}`);
      if (name === "install-manifest-v3.schema.json") {
        assert.deepEqual(parsed.required?.includes("schemaVersion"), true);
      }
    }
  });

  it("writeInstallManifest embeds $schema", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "agent-skills-schema-manifest-"));
    const manifest = buildManifest(
      cwd,
      "agents-md",
      ["global"],
      false,
      defaultConflictPolicy(),
      { written: [], skipped: [] },
      {},
    );
    await writeInstallManifest(cwd, manifest);
    const raw = JSON.parse(
      await readFile(join(cwd, ".agent-skills", "manifest.json"), "utf8"),
    ) as { $schema?: string; schemaVersion?: number };
    assert.equal(raw.$schema, INSTALL_MANIFEST_V3_SCHEMA_URL);
    assert.equal(raw.schemaVersion, MANIFEST_SCHEMA_VERSION);
  });

  it("writeSkillsLock embeds $schema", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "agent-skills-schema-lock-"));
    await writeSkillsLock(cwd, { version: 1, skills: {} });
    const raw = JSON.parse(await readFile(join(cwd, "skills-lock.json"), "utf8")) as {
      $schema?: string;
    };
    assert.equal(raw.$schema, SKILLS_LOCK_V1_SCHEMA_URL);
  });
});
