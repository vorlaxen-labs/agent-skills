import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { policyFromManifest, resolvePolicy } from "../../src/conflict/resolve.js";
import { defaultPolicyOverrides } from "../../src/conflict/path-policy.js";
import type { ConflictPolicyV2 } from "../../src/conflict/types.js";

const sampleManifestPolicy: ConflictPolicyV2 = {
  default: "skip",
  overrides: defaultPolicyOverrides(),
};

describe("resolvePolicy", () => {
  it("returns null when there are no conflicts", async () => {
    const policy = await resolvePolicy([], { yes: false, interactive: false });
    assert.equal(policy, null);
  });

  it("honors explicit onConflict override", async () => {
    const policy = await resolvePolicy(["/tmp/AGENTS.md"], {
      onConflict: "replace",
      yes: false,
      interactive: false,
    });
    assert.equal(policy?.default, "replace");
  });

  it("uses append defaults for --yes", async () => {
    const policy = await resolvePolicy(["/tmp/AGENTS.md"], {
      yes: true,
      interactive: false,
    });
    assert.equal(policy?.default, "append");
    assert.equal(policy?.appendOrder, "vorlaxen-first");
  });

  it("uses append defaults when interactive is false", async () => {
    const policy = await resolvePolicy(["/tmp/AGENTS.md"], {
      interactive: false,
    });
    assert.equal(policy?.default, "append");
  });

  it("merges conflictOverrides under yes mode", async () => {
    const policy = await resolvePolicy(["/tmp/AGENTS.md"], {
      yes: true,
      conflictOverrides: { "AGENTS.md": "replace" },
      interactive: false,
    });
    assert.equal(policy?.overrides["AGENTS.md"], "replace");
  });
});

describe("policyFromManifest", () => {
  it("returns manifest policy when override is inherit", () => {
    assert.deepEqual(
      policyFromManifest(sampleManifestPolicy, "inherit"),
      sampleManifestPolicy,
    );
  });

  it("builds policy from CLI override", () => {
    const policy = policyFromManifest(sampleManifestPolicy, "replace");
    assert.equal(policy?.default, "replace");
  });

  it("includes appendOrder only for append strategy", () => {
    const append = policyFromManifest(null, "append", "existing-first");
    assert.equal(append?.appendOrder, "existing-first");
    const replace = policyFromManifest(null, "replace", "existing-first");
    assert.equal(replace?.appendOrder, undefined);
  });

  it("returns manifest when no override", () => {
    assert.deepEqual(policyFromManifest(sampleManifestPolicy), sampleManifestPolicy);
  });
});
