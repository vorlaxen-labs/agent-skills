# `list`

List available platforms and skills.

```bash
npx @vorlaxen-labs/agent-skills list
npx @vorlaxen-labs/agent-skills list --json
```

## Options

| Flag | Description |
|------|-------------|
| `--json` | Machine-readable output |

## Platforms

| Id | Label |
|----|-------|
| `agents-md` | AGENTS.md |
| `cursor` | Cursor |
| `claude-code` | Claude Code |
| `copilot` | Copilot |

## Skills

| Id | Category | Default on init |
|----|----------|-----------------|
| `global` | Standard | Yes |

Other skills are not bundled — integrate them with [`add`](add.md) or [`hub`](hub.md). See [Included skills](../included-skills.md).
