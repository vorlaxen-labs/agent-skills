# `remove`

Remove selected skills from an existing installation.

```bash
npx @vorlaxen-labs/agent-skills remove <skill-ids...>
```

## Options

| Flag | Description |
|------|-------------|
| `-C, --cwd <dir>` | Target project directory |
| `-y, --yes` | Skip confirmation prompt |
| `--force` | Remove files even without Vorlaxen watermark |
| `--dry-run` | Show what would be removed |
| `--json` | Machine-readable output |
| `--verbose` | Verbose logging |

## Example

```bash
npx @vorlaxen-labs/agent-skills remove my-integrated-skill --yes
npx @vorlaxen-labs/agent-skills remove global --yes
```

Bundled id `global` uses `.agent-skills/manifest.json`. Names from `skills-lock.json` remove integrated skills only.

See also [`add`](add.md) and [`uninstall`](uninstall.md).
