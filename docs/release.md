# Release (maintainers)

Publishing is automated on **`main`** via semantic-release and the **Publish Package** workflow — same model as [@vorlaxen-labs/bar-js](https://github.com/vorlaxen-labs/bar-js).

See **[PUBLISHING.md](./PUBLISHING.md)** for Trusted Publishing setup, conventional commits, and troubleshooting.

Quick path after setup:

1. Merge to `main` with a conventional commit (`fix:`, `feat:`, or breaking change).
2. CI passes → **Publish Package** bumps version, publishes npm, creates GitHub Release.

Do **not** rely on manual `git tag v*` pushes; tag-based `release.yml` was removed in favor of `publish.yml`.

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
├── bundled/               # Snapshot shipped with npm package (built in CI)
├── rules/global.mdc       # Cursor always-on (synced with AGENTS.md)
├── skills/global/         # Cursor skill (synced with AGENTS.md)
├── docs/                  # CLI documentation + JSON schemas
├── CONTRIBUTING.md
├── SKILL-SPEC.md
└── LICENSE
```

See [CONTRIBUTING.md](../CONTRIBUTING.md) for sync checks and contribution paths.
