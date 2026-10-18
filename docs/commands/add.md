# `add`

Install skills from a **GitHub repository** or **local path** into the current project.

```bash
npx @vorlaxen-labs/agent-skills add <source> [skill-names...]
```

Does not use the bundled catalog — use [`init`](init.md) for global standards.

## Arguments

| Argument | Meaning |
|----------|---------|
| `<source>` | `owner/repo`, `hub:<hubId>`, GitHub URL, or local path |
| `[skill-names...]` | Optional skill `name` from each `SKILL.md` frontmatter (default: all discovered) |

## Options

| Flag | Description |
|------|-------------|
| `-s, --skill <names...>` | Same as positional skill names |
| `--ref <git-ref>` | Git ref for GitHub sources (default: `main`) |
| `-C, --cwd <dir>` | Target project directory |
| `-y, --yes` | Non-interactive |
| `--dry-run` | Plan without writing |
| `--no-cache` | Bypass GitHub response cache |
| `--json` | Machine-readable output |

## Examples

```bash
npx @vorlaxen-labs/agent-skills hub add vorlaxen-skills-hub
npx @vorlaxen-labs/agent-skills add hub:vorlaxen-skills-hub -s bar-js -y
npx @vorlaxen-labs/agent-skills add vercel-labs/agent-skills -s web-design-guidelines -y
npx @vorlaxen-labs/agent-skills add ./vendor/my-skills -y
```

Writes `.agents/skills/<name>/` and updates `skills-lock.json`.

See [Integrations](../integrations.md).
