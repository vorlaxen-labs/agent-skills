# `telemetry`

Manage the **persistent** anonymous telemetry preference (stored outside the project).

```bash
npx @vorlaxen-labs/agent-skills telemetry status
npx @vorlaxen-labs/agent-skills telemetry no
npx @vorlaxen-labs/agent-skills telemetry yes
```

## Options

| Flag | Description |
|------|-------------|
| `--json` | Machine-readable output |

## Per-run opt-out

To disable telemetry for a single command without changing saved preference:

```bash
npx @vorlaxen-labs/agent-skills --no-telemetry init
```

See [Telemetry](../telemetry.md) for what is collected and config file location.
