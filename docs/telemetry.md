# Telemetry

The CLI sends **anonymous usage events** when a command completes, unless telemetry is disabled.

## What is collected

- Command name, duration, exit code
- For install commands: platform, skill count, remote/dry-run flags
- CLI name and version
- Node major version, OS, architecture, Linux distribution (when detectable)
- Anonymous id stored in local config (see below)

## What is not collected

- File paths
- Usernames
- Project names or identifiers
- File contents

## Persistent preference

Config file (created on first run):

- **Linux/macOS:** `$XDG_CONFIG_HOME/vorlaxen/telemetry.json` (default `~/.config/vorlaxen/telemetry.json`)

```bash
npx @vorlaxen-labs/agent-skills telemetry status
npx @vorlaxen-labs/agent-skills telemetry no
npx @vorlaxen-labs/agent-skills telemetry yes
```

Use `--json` on `telemetry` for machine-readable output.

## Opt out for one invocation

Per-run override (does not change saved preference):

```bash
npx @vorlaxen-labs/agent-skills --no-telemetry init
VORLAXEN_TELEMETRY=0 npx @vorlaxen-labs/agent-skills init
```

Accepted env values: `0`, `false`, `no`.

When telemetry is enabled globally, `--no-telemetry` or `VORLAXEN_TELEMETRY=0` skips events for that process only.
