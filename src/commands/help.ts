import { Command } from "commander";
import { PLATFORMS, SKILLS } from "../core/bundled-catalog.js";
import { getPackageVersion } from "../core/version.js";

const SPECIAL_TOPICS = new Set(["sources", "files", "workflows"]);

type CommandNode = {
  name: string;
  description: string;
  usage?: string;
  subcommands: CommandNode[];
};

const COMMAND_EXTRAS: Record<
  string,
  { summary?: string; examples: string[]; notes?: string[] }
> = {
  init: {
    summary:
      "Bootstrap bundled engineering standards for your editor/CLI layout and write .agent-skills/manifest.json.",
    examples: [
      "agent-skills init",
      "agent-skills init --platform cursor --skills global -y",
      "agent-skills init --dry-run --platform agents-md --skills global",
      "agent-skills init --remote main --on-conflict append",
    ],
    notes: [
      `Platforms: ${PLATFORMS.map((p) => p.id).join(", ")}`,
      `Bundled skill ids: ${SKILLS.map((s) => s.id).join(", ")}`,
    ],
  },
  add: {
    summary:
      "Integrate skills from GitHub, a local folder, or a subscribed hub (hub:<id>) into .agents/skills and skills-lock.json.",
    examples: [
      "agent-skills add owner/skills-repo -s my-skill",
      "agent-skills add https://github.com/owner/repo/tree/main/skills/foo",
      "agent-skills add ./path/to/local-skills",
      "agent-skills add hub:vorlaxen-skills-hub -s bar-js -y",
      "agent-skills add owner/repo --dry-run --no-cache",
    ],
    notes: [
      "Without -s/--skill, every SKILL.md discovered in the source is installed.",
      "Hub installs require hub add <id> first unless using a one-off GitHub path.",
    ],
  },
  hub: {
    summary:
      "Manage hub subscriptions (agent-skills-hubs.json) and install skills listed in each hub catalog (agent-skills.hub.json).",
    examples: [
      "agent-skills hub add vorlaxen-skills-hub",
      "agent-skills hub list",
      "agent-skills hub install vorlaxen-skills-hub -s bar-js",
      "agent-skills hub update vorlaxen-skills-hub --skills",
    ],
  },
  "hub add": {
    examples: [
      "agent-skills hub add vorlaxen-skills-hub",
      "agent-skills hub add owner/custom-hub --ref main --project",
    ],
    notes: ["Default hub source: vorlaxen-labs/<hubId> on GitHub."],
  },
  "hub install": {
    examples: [
      "agent-skills hub install vorlaxen-skills-hub -s skill-alias",
      "agent-skills add hub:vorlaxen-skills-hub -s skill-alias",
    ],
    notes: ["hub install is sugar for add hub:<id> with catalog aliases."],
  },
  update: {
    examples: [
      "agent-skills update",
      "agent-skills update --remote main --dry-run",
      "agent-skills update --on-conflict replace -y",
    ],
    notes: ["Re-applies skills from the install manifest; use after upstream changes."],
  },
  doctor: {
    examples: [
      "agent-skills doctor",
      "agent-skills doctor --strict",
      "agent-skills doctor --fix",
      "agent-skills doctor --fix-update --dry-run",
    ],
  },
  remove: {
    examples: [
      "agent-skills remove global -y",
      "agent-skills remove my-integrated-skill --dry-run",
    ],
    notes: ["Accepts bundled ids (global) or names from skills-lock.json."],
  },
  uninstall: {
    examples: ["agent-skills uninstall -y", "agent-skills uninstall --dry-run"],
    notes: ["Removes the Vorlaxen install manifest and bundled layout (not lock-only skills)."],
  },
};

function commandPath(cmd: Command, root: Command): string[] {
  const parts: string[] = [];
  let current: Command | null = cmd;
  while (current && current !== root) {
    parts.unshift(current.name());
    current = current.parent;
  }
  return parts;
}

function commandKey(cmd: Command, root: Command): string {
  return commandPath(cmd, root).join(" ");
}

function buildCommandNode(cmd: Command, root: Command): CommandNode {
  const children = cmd.commands
    .filter((c) => c.name() !== "help")
    .map((c) => buildCommandNode(c, root));
  return {
    name: cmd.name(),
    description: cmd.description(),
    usage: cmd.usage(),
    subcommands: children,
  };
}

function collectCommandTree(root: Command): CommandNode[] {
  return root.commands.filter((c) => c.name() !== "help").map((c) => buildCommandNode(c, root));
}

function findCommand(root: Command, topic: string[]): Command | undefined {
  if (topic.length === 0) {
    return undefined;
  }
  let current: Command = root;
  for (const segment of topic) {
    const next = current.commands.find((c) => c.name() === segment);
    if (!next) {
      return undefined;
    }
    current = next;
  }
  return current === root ? undefined : current;
}

function formatOptionLine(flags: string, description: string): string {
  return `    ${flags.padEnd(28)} ${description}`;
}

function printCommandOptions(cmd: Command): void {
  const options = cmd.options.filter((o) => o.long !== "--help" && o.long !== "--version");
  if (options.length === 0) {
    return;
  }
  console.log("\nOptions:\n");
  for (const opt of options) {
    const flags = [opt.short ? `-${opt.short}` : "", opt.long].filter(Boolean).join(", ");
    console.log(formatOptionLine(flags, opt.description));
  }
}

function printCommandDetail(root: Command, cmd: Command): void {
  const key = commandKey(cmd, root);
  const path = commandPath(cmd, root).join(" ");
  const helper = cmd.createHelp();
  const usage = helper.commandUsage(cmd);

  console.log(`\n${path}\n`);
  console.log(`  ${cmd.description()}\n`);
  console.log(`Usage:\n  ${usage}\n`);

  printCommandOptions(cmd);

  const extras = COMMAND_EXTRAS[key];
  if (extras?.summary) {
    console.log("\nAbout:\n");
    console.log(`  ${extras.summary}\n`);
  }

  if (extras?.examples?.length) {
    console.log("Examples:\n");
    for (const ex of extras.examples) {
      console.log(`  ${ex}`);
    }
    console.log("");
  }

  if (extras?.notes?.length) {
    console.log("Notes:\n");
    for (const note of extras.notes) {
      console.log(`  • ${note}`);
    }
    console.log("");
  }

  const subcommands = cmd.commands.filter((c) => c.name() !== "help");
  if (subcommands.length > 0) {
    console.log("Subcommands:\n");
    for (const sub of subcommands) {
      console.log(`  ${sub.name().padEnd(14)} ${sub.description()}`);
    }
    console.log(`\n  Run \`agent-skills help ${path} <subcommand>\` for subcommand details.\n`);
  }
}

function printRootHelp(root: Command): void {
  const version = getPackageVersion();
  console.log(`
Agent Skills CLI v${version}

Loader for shared engineering standards and external agent skills (Cursor, Claude Code,
Copilot, AGENTS.md, and compatible tools).

Quick start:

  agent-skills init
  agent-skills hub add vorlaxen-skills-hub
  agent-skills add hub:vorlaxen-skills-hub -s <alias> -y

Global options (all commands):

  -V, --version       Print package version
  -h, --help          Short command-specific help (Commander)

Common project flags (init, update, add, doctor, …):

  -C, --cwd <dir>     Target project directory (default: current directory)
  --dry-run           Plan without writing files
  --json              Machine-readable output
  --verbose           Extra logging
  --no-cache          Bypass GitHub response cache

Topics (detailed guides):

  agent-skills help sources      GitHub, local paths, and hub: sources
  agent-skills help files        Manifest, lock file, and hub config paths
  agent-skills help workflows    Typical day-to-day command sequences

Commands:
`);

  for (const node of collectCommandTree(root)) {
    printCommandIndexLine(node, "  ");
  }

  console.log(`
Use \`agent-skills help <command>\` or \`agent-skills help hub <subcommand>\` for full
usage, flags, and examples. Package docs: https://github.com/vorlaxen-labs/Agent-Skills
`);
}

function printCommandIndexLine(node: CommandNode, indent: string): void {
  console.log(`${indent}${node.name.padEnd(16)} ${node.description}`);
  for (const child of node.subcommands) {
    printCommandIndexLine(child, `${indent}  `);
  }
}

function printSourcesHelp(): void {
  console.log(`
Skill sources

  owner/repo              GitHub repository (skills/, .agents/skills/, or repo root)
  https://github.com/...  GitHub URL with optional /tree/<ref>/path
  ./relative/path         Local directory containing SKILL.md trees
  hub:<hubId>             Alias from a subscribed hub catalog

Examples:

  agent-skills add vercel-labs/agent-skills -s web-design-guidelines
  agent-skills add ./vendor/my-skills --ref main
  agent-skills add hub:my-hub -s catalog-alias

Refs:

  --ref main              Git branch, tag, or SHA for GitHub sources (default: main)
  init/update --remote    Pull bundled snapshot from GitHub instead of npm package files
`);
}

function printFilesHelp(): void {
  console.log(`
Project files

  .agent-skills/manifest.json     Install manifest (platform, bundled skills, conflict policy)
  skills-lock.json                Integrated external/hub skills (hashes, sources)
  agent-skills-hubs.json          Hub subscriptions (user config or --project in cwd)
  agent-skills.hub.json           Hub catalog (in the hub repo; cached locally)

Doctor compares manifest snapshots and on-disk files to detect drift.
Remove/uninstall targets differ: remove drops selected skills; uninstall removes the
Vorlaxen-managed install layout.
`);
}

function printWorkflowsHelp(): void {
  console.log(`
Typical workflows

  New repo:
    agent-skills init --platform cursor --skills global -y
    agent-skills add owner/skills -s my-skill

  Hub-based team catalog:
    agent-skills hub add vorlaxen-skills-hub
    agent-skills hub list --skills
    agent-skills hub install vorlaxen-skills-hub -s skill-alias

  Maintenance:
    agent-skills doctor --strict
    agent-skills update
    agent-skills doctor --fix

  CI / scripting:
    agent-skills init -y --platform agents-md --skills global --json
    agent-skills add owner/repo -s skill --dry-run --json
`);
}

export interface HelpOptions {
  json?: boolean;
}

export function runHelp(root: Command, topic: string[], options: HelpOptions = {}): number {
  if (options.json && topic.length === 0) {
    console.log(
      JSON.stringify(
        {
          version: getPackageVersion(),
          commands: collectCommandTree(root),
          topics: [...SPECIAL_TOPICS],
        },
        null,
        2,
      ),
    );
    return 0;
  }

  if (topic.length === 0) {
    printRootHelp(root);
    return 0;
  }

  if (topic.length === 1 && SPECIAL_TOPICS.has(topic[0]!)) {
    switch (topic[0]) {
      case "sources":
        printSourcesHelp();
        return 0;
      case "files":
        printFilesHelp();
        return 0;
      case "workflows":
        printWorkflowsHelp();
        return 0;
      default:
        break;
    }
  }

  const cmd = findCommand(root, topic);
  if (!cmd) {
    console.error(`Unknown help topic: ${topic.join(" ")}`);
    console.error("Run `agent-skills help` for the full guide or `agent-skills help workflows`.");
    return 1;
  }

  printCommandDetail(root, cmd);
  return 0;
}

export function registerHelpCommand(program: Command): void {
  program
    .command("help")
    .description("Detailed usage guide with examples and topics")
    .argument("[topic...]", "Command path (init, hub add, …) or topic (sources, files, workflows)")
    .option("--json", "Emit command index as JSON (root help only)")
    .action(async (topic: string[], opts: { json?: boolean }) => {
      const code = runHelp(program, topic, { json: opts.json });
      if (code !== 0) {
        process.exitCode = code;
      }
    });
}
