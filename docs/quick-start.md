# Quick start — Vorlaxen Agent Skills CLI

Install global engineering standards, then integrate other skills from external GitHub repos:

```bash
npx @vorlaxen-labs/agent-skills init
```

The CLI walks you through platform selection (AGENTS.md, Cursor, Claude Code, Copilot). Bundled content is **global** only; use `add` for everything else.

## Non-interactive example

```bash
npx @vorlaxen-labs/agent-skills init --platform cursor --skills global -y
npx @vorlaxen-labs/agent-skills add vercel-labs/agent-skills -s web-design-guidelines -y
```

## Preview without writing

```bash
npx @vorlaxen-labs/agent-skills init --dry-run --platform cursor --skills global
```

## List available options

```bash
npx @vorlaxen-labs/agent-skills list
npx @vorlaxen-labs/agent-skills list --json
```

Invalid `--platform` or `--skills` values are rejected with a list of available options.

## After install

| Goal | Command |
|------|---------|
| Check health | [`doctor`](commands/doctor.md) |
| Update skills | [`update`](commands/update.md) |
| Add more skills | [`add`](commands/add.md) |
| See drift | [`diff`](commands/diff.md) or [`status`](commands/status.md) |

See [init](commands/init.md) for all flags, [conflicts and manifest](conflicts-and-manifest.md) when agent files already exist, and [remote source and cache](remote-and-cache.md) to pull from GitHub instead of the bundled snapshot.
