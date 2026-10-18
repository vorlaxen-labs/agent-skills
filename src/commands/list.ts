import { Command } from "commander";
import { printList, setOutputOptions } from "../core/output.js";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List available platforms and skills")
    .option("--json", "Machine-readable output")
    .option("--verbose", "Verbose logging")
    .action(async (opts) => {
      setOutputOptions({ json: opts.json ?? false, verbose: opts.verbose ?? false });
      printList();
    });
}
