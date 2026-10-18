# `doctor`

Check installed agent skills health — missing files, drift, retired skill ids, and manifest integrity.

```bash
npx @vorlaxen-labs/agent-skills doctor
```

## Options

| Flag | Description |
|------|-------------|
| `-C, --cwd <dir>` | Target project directory |
| `--verbose` | Verbose logging |
| `--json` | Machine-readable output |
| `--strict` | Treat warnings as errors (exit 1) |
| `--fix` | Repair missing or drifted files from snapshot |
| `--fix-update` | Run update to refresh from upstream |
| `--force` | Fix files even without Vorlaxen watermark |
| `--dry-run` | Preview fix actions |
| `--no-cache` | Bypass GitHub response cache |

## Examples

```bash
npx @vorlaxen-labs/agent-skills doctor --json
npx @vorlaxen-labs/agent-skills doctor --fix
npx @vorlaxen-labs/agent-skills doctor --fix-update
npx @vorlaxen-labs/agent-skills doctor --strict
```

If the project manifest still lists skill ids that were removed from the catalog, doctor warns and suggests `agent-skills remove <ids>`.

Exit code is `1` when errors are found, or when `--strict` is set and warnings exist.
