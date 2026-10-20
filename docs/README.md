# Agent Skills CLI documentation

Reference for the **Vorlaxen Agent Skills loader** — [@vorlaxen-labs/agent-skills](https://www.npmjs.com/package/@vorlaxen-labs/agent-skills) on npm, [Agent-Skills on GitHub](https://github.com/vorlaxen-labs/Agent-Skills).

## Getting started

- [Quick start](quick-start.md) — install skills in your project in one command

## Commands

| Command | Description |
|---------|-------------|
| [`init`](commands/init.md) | Interactive or scripted first-time setup |
| [`list`](commands/list.md) | List available platforms and skills |
| [`doctor`](commands/doctor.md) | Check installation health and repair drift |
| [`update`](commands/update.md) | Refresh installed skills from snapshot or remote |
| [`add`](commands/add.md) | Integrate skills from a GitHub repo, hub, or local path |
| [`hub`](commands/hub.md) | Subscribe to skill hubs and bulk install/update |
| [`remove`](commands/remove.md) | Remove selected skills |
| [`uninstall`](commands/uninstall.md) | Remove all installed agent skill files |

## Concepts

- [Integrations](integrations.md) — external repos and `skills-lock.json`
- [Conflicts and manifest](conflicts-and-manifest.md) — merge strategies, platform manifest, lock file
- [JSON Schemas](schemas/README.md) — `manifest.json` and `skills-lock.json` (draft 2020-12)
- [Remote source and cache](remote-and-cache.md) — bundled snapshot vs GitHub, response cache
- [Manual install](manual-install.md) — copy files without the CLI

## Content reference

- [Included skills](included-skills.md) — bundled global standards only
- [Release (maintainers)](release.md) — overview
- [Publishing](PUBLISHING.md) — semantic-release, Trusted Publishing (same as bar-js)
