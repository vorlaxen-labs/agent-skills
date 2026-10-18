# Release (maintainers)

Publish to npm via GitHub tag. Requires `NPM_TOKEN` repository secret.

```bash
git tag v3.0.0
git push origin v3.0.0
```

CI runs checks and tests, then `npm publish` and creates a GitHub Release.

## Repo layout

```
Agent-Skills/
├── AGENTS.md              # Universal — bundled global standard
├── package.json           # @vorlaxen-labs/agent-skills
├── src/                   # CLI source
│   ├── commands/          # init, add, hub, update, remove, doctor, status, diff, telemetry, …
│   ├── install/           # plan, execute, merge, manifest v3, skill-paths
│   ├── hub/               # hub subscriptions and catalog install
│   ├── doctor/            # health checks, fix
│   ├── source/            # bundled + GitHub fetch + cache
│   ├── conflict/          # detect + resolve + per-path policy
│   └── telemetry/         # anonymous usage events + config
├── bundled/               # Snapshot shipped with npm package
├── rules/global.mdc       # Cursor always-on (synced with AGENTS.md)
├── skills/global/         # Cursor skill (synced with AGENTS.md)
├── docs/                  # CLI documentation + JSON schemas
├── CONTRIBUTING.md
├── SKILL-SPEC.md
└── LICENSE
```

See [CONTRIBUTING.md](../CONTRIBUTING.md) for sync checks and contribution paths.
