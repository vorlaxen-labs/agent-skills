# `hub`

Subscribe to **skill hubs** (remote `agent-skills.hub.json` catalogs), list entries, and install or update skills in bulk.

## Quick start

```bash
npx @vorlaxen-labs/agent-skills hub add vorlaxen-skills-hub
npx @vorlaxen-labs/agent-skills add hub:vorlaxen-skills-hub -s bar-js -y
npx @vorlaxen-labs/agent-skills hub update vorlaxen-skills-hub --skills
```

Primary install path: **`add hub:<hubId> -s <alias>`**.  
`hub install` is sugar for the same behavior.

## Subcommands

| Command | Description |
|---------|-------------|
| `hub add <id-or-source>` | Subscribe; validates catalog |
| `hub remove <hubId...>` | Unsubscribe (does not remove installed skills) |
| `hub list` | Subscriptions (default) or `hub list --skills` |
| `hub show <hubId>` | One catalog |
| `hub install <hubId>` | Install `-s` alias(es) or `--all` |
| `hub update [hubId...]` | Refresh catalog cache; `--skills` reinstalls matching lock entries |
| `hub status` | Subscriptions, cache age, possible hub ↔ lock matches |
| `hub doctor` | Validate subscriptions; `--fix` removes broken entries |
| `hub diff <hubId>` | Cache vs remote catalog |
| `hub search <query>` | Search aliases/descriptions |

## Files

| File | Location |
|------|----------|
| Subscriptions (user) | `~/.config/vorlaxen/agent-skills-hubs.json` |
| Subscriptions (project) | `./agent-skills-hubs.json` (`hub add --project`) |
| Remote catalog | `agent-skills.hub.json` in hub repo |

## `hub update`

- **Default:** catalog cache only.
- **`--skills`:** reinstall project skills whose lock `source` + name match a catalog entry (force). Does not install missing skills.

## See also

- [`add`](add.md) — `hub:<id>` source
- [Integrations](../integrations.md)
