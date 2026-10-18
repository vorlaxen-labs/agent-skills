import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parsePlatform,
  parseRemoveSkillIds,
  parseSkillIds,
  ValidationError,
} from "../../src/core/validate.js";

describe("parsePlatform", () => {
  it("accepts known platforms", () => {
    assert.equal(parsePlatform("agents-md"), "agents-md");
    assert.equal(parsePlatform("cursor"), "cursor");
  });

  it("rejects unknown platforms", () => {
    assert.throws(() => parsePlatform("unknown"), ValidationError);
  });
});

describe("parseSkillIds", () => {
  it("accepts global", () => {
    assert.deepEqual(parseSkillIds(["global"]), ["global"]);
    assert.deepEqual(parseSkillIds([" global "]), ["global"]);
  });

  it("rejects unknown bundled ids", () => {
    assert.throws(() => parseSkillIds(["kill-ai-slop"]), ValidationError);
    assert.throws(() => parseSkillIds(["web-frontend"]), ValidationError);
  });

  it("rejects empty selection", () => {
    assert.throws(() => parseSkillIds([]), ValidationError);
    assert.throws(() => parseSkillIds(["  "]), ValidationError);
  });
});

describe("parseRemoveSkillIds", () => {
  it("accepts retired or custom ids not in bundled catalog", () => {
    assert.deepEqual(parseRemoveSkillIds(["legacy-skill"]), ["legacy-skill"]);
  });

  it("rejects empty selection", () => {
    assert.throws(() => parseRemoveSkillIds([]), ValidationError);
  });
});
