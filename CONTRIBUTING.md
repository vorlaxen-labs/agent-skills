# Contributing

Thank you for improving Vorlaxen Agent Skills.

**Community:** [Welcome / FAQ](https://github.com/vorlaxen-labs/agent-skills/discussions/1) · [Q&A](https://github.com/vorlaxen-labs/agent-skills/discussions/categories/q-a) · [Issue templates](https://github.com/vorlaxen-labs/agent-skills/issues/new/choose) · [SECURITY.md](SECURITY.md)

This repository is primarily a **loader CLI** (`@vorlaxen-labs/agent-skills`) plus **bundled global engineering standards**. Domain skills, audits, and team-specific modules belong in **separate GitHub repositories** (or hubs), not in this tree.

**Skill authoring format:** [SKILL-SPEC.md](SKILL-SPEC.md)

---

## Ways to contribute

| Area | What to change |
|------|----------------|
| **CLI** | TypeScript under `src/`, tests under `test/`, docs under `docs/` |
| **Bundled global** | `AGENTS.md`, `skills/global/SKILL.md`, `rules/global.mdc` (keep in sync) |
| **External skills** | Open a PR in your skill repo; optional hub catalog in `agent-skills.hub.json` |

Do not add new bundled skill ids here without a maintainer decision — the catalog is intentionally **`global` only**. Use `add` / `hub` for everything else.

---

## Global standards — source of truth

When editing global content, update **all three** files. Bodies must match from `# Core Principle` onward:

| File | Purpose |
|------|---------|
| `AGENTS.md` | Universal — project root for all tools |
| `skills/global/SKILL.md` | Cursor on-demand skill |
| `rules/global.mdc` | Cursor always-on rule |

CI runs `npm run check`, which includes global sync (`AGENTS.md` ↔ `skills/global/SKILL.md` ↔ `rules/global.mdc`).

---

## Developing the CLI

Requirements: Node **18+**, npm or pnpm.

```bash
npm install
npm run build
npm test
npm run ci          # sync checks + tests (same as CI)
```

| Script | Purpose |
|--------|---------|
| `npm run dev` | Run CLI via `tsx src/cli.ts` |
| `npm run check:sync` | Global markdown sync |
| `npm run check:bundled` | Bundled snapshot matches `skills/` + `rules/` |

JSON schemas for manifests and lock files: [docs/schemas/README.md](docs/schemas/README.md).

---

## Content guidelines (global and external skills)

- **Core principle:** Constrain decisions, not implementations.
- Standards modules: **Core Principle**, **Hard Rules**, `# Decision:` boundaries.
- Use MUST / MUST NOT / STOP / ASK — not vague "consider" or "prefer".
- Do not prescribe implementation patterns, specific libraries, or folder layouts unless the skill is an explicit workflow with documented scripts.
- Keep modules focused and composable.

---

## Platform compatibility

Prefer portable markdown in skill bodies. Tool-specific metadata belongs only in:

| Tool-specific | Files |
|---------------|-------|
| Cursor skill `name` / `description` | `skills/**/SKILL.md` frontmatter |
| Cursor always-on | `rules/global.mdc` frontmatter |

Core instruction content should read the same whether pasted into Claude, Copilot, or Cursor.

---

## Pull requests

1. One logical change per PR when possible (CLI fix vs global copy vs docs).
2. Run `npm run ci` before opening.
3. Update user-facing docs when behavior or commands change (`docs/`, `README.md`, this file, `SKILL-SPEC.md` as needed).

---

## Questions

Open an [issue](https://github.com/vorlaxen-labs/Agent-Skills/issues) before large structural changes (new bundled skills, manifest schema breaks, hub format changes).
