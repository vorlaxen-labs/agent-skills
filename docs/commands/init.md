# `init`

Interactive setup — pick platform and skills, then write agent configuration files into your project.

```bash
npx @vorlaxen-labs/agent-skills init
```

## Options

| Flag | Description |
|------|-------------|
| `-p, --platform <platform>` | Target platform: `agents-md`, `cursor`, `claude-code`, `copilot` |
| `-s, --skills <ids>` | Comma-separated skill ids (see [`list`](list.md)) |
| `-r, --remote [ref]` | Fetch from GitHub — omit ref for package version tag, or pass e.g. `main` |
| `-y, --yes` | Skip prompts; defaults to AGENTS.md platform and default-selected skills |
| `-C, --cwd <dir>` | Target project directory (default: current directory) |
| `--dry-run` | Show planned writes without changing files |
| `--verbose` | Verbose logging |
| `--json` | Machine-readable output |
| `--on-conflict <mode>` | Conflict strategy: `replace`, `append`, `skip` |
| `--append-order <order>` | When appending: `existing-first` or `vorlaxen-first` |
| `--on-conflict-for <glob=mode>` | Per-path conflict override (repeatable) |
| `--no-cache` | Bypass GitHub response cache |

## Examples

```bash
# Cursor with bundled global only
npx @vorlaxen-labs/agent-skills init --platform cursor --skills global -y

# Latest from GitHub main branch
npx @vorlaxen-labs/agent-skills init --remote=main

# Force replace on conflict
npx @vorlaxen-labs/agent-skills init --on-conflict replace --platform agents-md --skills global

# Append with your content first
npx @vorlaxen-labs/agent-skills init --on-conflict append --append-order existing-first --yes

# Per-path override
npx @vorlaxen-labs/agent-skills init --on-conflict append --on-conflict-for AGENTS.md=append --yes
```

When `AGENTS.md`, `.cursor/rules/*`, or similar files already exist, the CLI asks how to handle conflicts unless `--yes` or `--on-conflict` is set. See [Conflicts and manifest](../conflicts-and-manifest.md).
