# Manual install

You can copy files directly without the CLI.

## AGENTS.md (most tools)

```bash
git clone https://github.com/vorlaxen-labs/Agent-Skills.git
cp Agent-Skills/AGENTS.md /path/to/your-project/
```

[`AGENTS.md`](../AGENTS.md) follows the [open AGENTS.md standard](https://agents.md/) — Claude Code, Cursor, Copilot, and others pick it up from the project root.

## Cursor

For always-on rules and on-demand skills:

```bash
cp Agent-Skills/rules/global.mdc ~/.cursor/rules/
cp -r Agent-Skills/skills/global ~/.cursor/skills/
```

For other skills, copy folders from an external skill pack or run [`add`](commands/add.md).

## Claude Code

```bash
cp AGENTS.md ~/.claude/CLAUDE.md
# or into your project as CLAUDE.md
```

## Other tools

Paste `AGENTS.md` into custom instructions. For additional skills, paste each skill's markdown body (skip YAML frontmatter) or use the CLI to install under `.agents/skills/`.

---

Manual install does not create `.agent-skills/manifest.json`. Lifecycle commands (`doctor`, `update`, `diff`, etc.) require a CLI installation. See [Quick start](quick-start.md).
