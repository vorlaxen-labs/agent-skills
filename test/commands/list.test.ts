import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { registerListCommand } from "../../src/commands/list.js";
import { PLATFORMS, SKILLS } from "../../src/core/bundled-catalog.js";
import { printList, setOutputOptions } from "../../src/core/output.js";
import { Command } from "commander";

describe("list command", () => {
  it("registers without throwing", () => {
    const program = new Command();
    registerListCommand(program);
  });

  it("json mode includes catalog data", () => {
    const chunks: string[] = [];
    const originalLog = console.log;
    console.log = (value?: unknown) => {
      chunks.push(String(value));
    };

    try {
      setOutputOptions({ json: true, verbose: false });
      printList();
      const parsed = JSON.parse(chunks.join("\n")) as {
        platforms: typeof PLATFORMS;
        skills: unknown[];
      };
      assert.equal(parsed.platforms.length, PLATFORMS.length);
      assert.equal(parsed.skills.length, SKILLS.length);
    } finally {
      console.log = originalLog;
    }
  });
});
