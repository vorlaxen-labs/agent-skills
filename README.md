# Vorlaxen Agent Skills — CLI loader for Cursor, Claude Code, and Copilot

[![CI](https://img.shields.io/github/actions/workflow/status/vorlaxen-labs/agent-skills/ci.yml?branch=main&label=CI)](https://github.com/vorlaxen-labs/agent-skills/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@vorlaxen-labs/agent-skills?label=npm)](https://www.npmjs.com/package/@vorlaxen-labs/agent-skills)
[![License: MIT](https://img.shields.io/github/license/vorlaxen-labs/agent-skills)](LICENSE)
[![Node](https://img.shields.io/node/v/@vorlaxen-labs/agent-skills)](package.json)
[![GitHub Discussions](https://img.shields.io/github/discussions/vorlaxen-labs/agent-skills?label=discussions)](https://github.com/vorlaxen-labs/agent-skills/discussions)

**`npx` CLI by [Vorlaxen Labs](https://github.com/vorlaxen-labs)** to bootstrap **[`AGENTS.md`](AGENTS.md) engineering standards** and **install agent skills from any GitHub repository** into [Cursor](https://cursor.com) (`.cursor/skills`, rules), [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [GitHub Copilot](https://github.com/features/copilot), Windsurf, OpenAI Codex, Gemini CLI, and other **AI coding agents** that load `SKILL.md` packs or project-level instructions.

> **Search terms:** agent skills CLI · cursor rules · agents-md · skill hub · skills-lock.json · install skills from GitHub · vercel-labs/skills compatible lock file

```bash
npx @vorlaxen-labs/agent-skills init
npx @vorlaxen-labs/agent-skills hub add vorlaxen-skills-hub
npx @vorlaxen-labs/agent-skills add hub:vorlaxen-skills-hub -s bar-js -y
```

| Install | [npm `@vorlaxen-labs/agent-skills`](https://www.npmjs.com/package/@vorlaxen-labs/agent-skills) · [Quick start](docs/quick-start.md) |
| Repo | [github.com/vorlaxen-labs/agent-skills](https://github.com/vorlaxen-labs/agent-skills) · [Welcome / FAQ (Discussions)](https://github.com/vorlaxen-labs/agent-skills/discussions/1) · [Releases](https://github.com/vorlaxen-labs/agent-skills/releases) |

---

## What is this?

| Role | What |
|------|------|
| **Loader CLI** | `init`, `add`, `hub`, `update`, `remove`, `doctor`, `list` |
| **Bundled default** | [`AGENTS.md`](AGENTS.md) global standards only (this repo stays small) |
| **Everything else** | Integrate from GitHub or local paths; tracked in `skills-lock.json` |

This repository is **not** a growing skill catalog. New skills live in their own repos and are added to **your** project:

```bash
npx @vorlaxen-labs/agent-skills add owner/skills-repo -s skill-name -y
```

---

## Who is it for?

- Teams standardizing **AI agent behavior** with [`AGENTS.md`](AGENTS.md) and [Cursor rules](https://cursor.com/docs/context/rules)
- Developers using **`npx`** to bootstrap **agent skills** without copying folders by hand
- Projects that need **reproducible** skill installs via **`skills-lock.json`** (compatible with [vercel-labs/skills](https://github.com/vercel-labs/skills))

---

## Supported tools

Works with any editor or CLI that loads skills from `.cursor/skills`, `.agents/skills`, Copilot instructions, or project-level `AGENTS.md`:

| Tool | Typical layout |
|------|----------------|
| [Cursor](https://cursor.com) | `.cursor/skills/`, `.cursor/rules/` |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | `.claude/skills/` (via planner) |
| [GitHub Copilot](https://github.com/features/copilot) | Copilot instruction files |
| Windsurf, Codex, Gemini CLI | Client-specific skill paths (see [integrations](docs/integrations.md)) |

See [Integrations](docs/integrations.md) for GitHub sources, local paths, and lock file layout.

---

## Core idea

**Constrain decisions, not implementations.**

Full rules: [`AGENTS.md`](AGENTS.md)

---

## Get started

```bash
# Global engineering standards for your platform
npx @vorlaxen-labs/agent-skills init

# Skills from another repo (SKILL.md layout — see SKILL-SPEC.md)
npx @vorlaxen-labs/agent-skills add vercel-labs/agent-skills -s web-design-guidelines -y
```

| Topic | Documentation |
|-------|---------------|
| Quick start | [docs/quick-start.md](docs/quick-start.md) |
| CLI commands | [docs/README.md](docs/README.md) |
| Integrations | [docs/integrations.md](docs/integrations.md) |
| Conflicts and manifest | [docs/conflicts-and-manifest.md](docs/conflicts-and-manifest.md) |
| Authoring skills | [SKILL-SPEC.md](SKILL-SPEC.md) |
| Contributing | [CONTRIBUTING.md](CONTRIBUTING.md) |

---

## FAQ

**How is this different from a skill marketplace?**  
This repo ships a **loader** plus **global defaults**. Domain skills stay in separate GitHub repositories; you `add` them per project.

**Do I need to publish to npm to use skills?**  
No. Run via `npx @vorlaxen-labs/agent-skills` or clone this repo for [manual install](docs/manual-install.md).

**What format must external skills use?**  
Each skill is a folder with `SKILL.md` and valid frontmatter — see [SKILL-SPEC.md](SKILL-SPEC.md).

**Where should I ask questions?**  
Start with the pinned [Welcome / FAQ](https://github.com/vorlaxen-labs/agent-skills/discussions/1) discussion; use [Q&A](https://github.com/vorlaxen-labs/agent-skills/discussions/categories/q-a) for new threads. [Open an issue](https://github.com/vorlaxen-labs/agent-skills/issues/new/choose) for bugs and feature requests.

**How do I report a security issue?**  
See [SECURITY.md](SECURITY.md) — please avoid public issues for vulnerabilities.

---

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Vorlaxen Labs.

Skills you install with `add` or `hub` from **other GitHub repositories** remain licensed by their respective authors; this license applies only to the loader, bundled global standards, docs, and schemas in this repo.
