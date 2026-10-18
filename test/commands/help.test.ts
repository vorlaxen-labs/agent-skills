import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Command } from "commander";
import { registerHelpCommand, runHelp } from "../../src/commands/help.js";
import { registerAddCommand } from "../../src/commands/add.js";
import { registerInitCommand } from "../../src/commands/init.js";

function buildProgram(): Command {
  const program = new Command();
  registerInitCommand(program);
  registerAddCommand(program);
  registerHelpCommand(program);
  return program;
}

describe("help command", () => {
  it("registers without throwing", () => {
    buildProgram();
  });

  it("root help lists core commands and topics", () => {
    const program = buildProgram();
    const chunks: string[] = [];
    const originalLog = console.log;
    console.log = (value?: unknown) => {
      chunks.push(String(value));
    };
    try {
      const code = runHelp(program, []);
      assert.equal(code, 0);
      const text = chunks.join("\n");
      assert.match(text, /Agent Skills CLI/);
      assert.match(text, /help sources/);
      assert.match(text, /\binit\b/);
      assert.match(text, /\badd\b/);
    } finally {
      console.log = originalLog;
    }
  });

  it("command help includes usage and examples for init", () => {
    const program = buildProgram();
    const chunks: string[] = [];
    const originalLog = console.log;
    console.log = (value?: unknown) => {
      chunks.push(String(value));
    };
    try {
      const code = runHelp(program, ["init"]);
      assert.equal(code, 0);
      const text = chunks.join("\n");
      assert.match(text, /Usage:/);
      assert.match(text, /--platform/);
      assert.match(text, /agent-skills init --platform cursor/);
    } finally {
      console.log = originalLog;
    }
  });

  it("returns exit code 1 for unknown topics", () => {
    const program = buildProgram();
    const originalError = console.error;
    console.error = () => {};
    try {
      assert.equal(runHelp(program, ["not-a-command"]), 1);
    } finally {
      console.error = originalError;
    }
  });
});
