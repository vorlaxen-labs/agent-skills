# Skill Specification

How to author **agent skills** consumed by [@vorlaxen-labs/agent-skills](https://www.npmjs.com/package/@vorlaxen-labs/agent-skills) — whether you publish a skill pack on GitHub or maintain the bundled global standard in this repo.

Each skill is a **directory** with a `SKILL.md` entry file. The CLI discovers skills via `SKILL.md` when you run `add`, `hub install`, or (for bundled ids) `init`.

---

## What this repository bundles

The [Agent-Skills](https://github.com/vorlaxen-labs/Agent-Skills) npm package ships **one** bundled standard:

| Id | Role |
|----|------|
| `global` | Universal engineering standards — decision boundaries for every task |

Everything else is integrated from **external GitHub repos**, **hubs**, or **local paths** and tracked in project `skills-lock.json`. See [integrations](docs/integrations.md).

---

## Bundled global layout (this repo only)

Global content must stay in sync across three files (CI: `npm run check`):

| Artifact | Path | Role |
|----------|------|------|
| Universal file | `AGENTS.md` | Project root — Claude, Copilot, Cursor, etc. |
| Cursor skill | `skills/global/SKILL.md` | On-demand global module |
| Cursor always-on | `rules/global.mdc` | Same body, `alwaysApply: true` |

**Sync rule:** markdown from `# Core Principle` through the end of the document must match across all three. Only frontmatter differs on `SKILL.md` / `.mdc`.

Install with:

```bash
npx @vorlaxen-labs/agent-skills init --platform cursor --skills global -y
```

---

## External skill pack layout

Typical repo or folder the CLI can `add`:

```
my-skills/
├── bar-js/
│   └── SKILL.md
└── api-design/
    ├── SKILL.md
    └── references/
        └── checklist.md
```

Optional for workflow-style skills:

```
my-audit-skill/
├── SKILL.md
├── references/
└── scripts/
    └── scan.mjs
```

Integrated skills are written under `.agents/skills/<name>/` (and `.cursor/skills/<name>/` when the project uses Cursor). They are **not** merged into `AGENTS.md` by `add`; only bundled `init` content targets platform instruction files.

---

## Skill types (authoring)

Use these categories when designing packs. They are **conventions** for authors — not ids in this repo’s bundled catalog.

### 1. Standard / global-like

Decision boundaries for broad coding work. Tool-agnostic markdown.

- **When:** every task in a domain or whole repo
- **Body:** Core Principle, Hard Rules, `# Decision:` sections (see below)

### 2. Domain modules

Extra boundaries on top of global — e.g. frontend UI, backend APIs.

- **When:** tasks in that domain (trigger terms in `description`)
- **Body:** extend global; do **not** paste the full global document again

### 3. Workflow modules

Scan, review, or fix workflows with `references/` and optional `scripts/`.

- **When:** explicit user tasks (audits, checklists, codegen helpers)
- **Body:** steps, commands, links to references; keep scripts dependency-free when possible

---

## Frontmatter

Every `SKILL.md` starts with YAML frontmatter. **Only frontmatter is tool-specific.** The markdown body must work when pasted into any agent tool.

### Required fields

```yaml
---
name: your-module
description: >-
  What it does. Third person. Include trigger terms so the agent knows WHEN
  to load this skill — package names, domain keywords, task types.
---
```

| Field | Rules |
|-------|-------|
| `name` | Lowercase, hyphens, max 64 chars. Match directory name where practical. |
| `description` | Max 1024 chars. **Third person.** Must include **what** + **when** + trigger terms. |

### Description examples

```yaml
# Domain module
description: >-
  Frontend decision boundaries. Constrain decisions, not implementations.
  Use for web UI components, pages, forms, client-side state, and frontend code.

# Workflow module
description: >-
  Scan UI copy for AI slop, triage findings, and apply fixes.
  Use when reviewing landing pages, marketing UI, or generated frontend text.
```

### Cursor-only files

`rules/global.mdc` uses `.mdc` frontmatter — not a skill:

```yaml
---
description: Global project rules for all interactions
alwaysApply: true
---
```

Do not put skill `name` in `.mdc` files.

---

## Body structure

### Core principle (standards modules)

Every standards-style module opens with:

```markdown
# Core Principle

**Constrain decisions, not implementations.**
```

Domain modules add one sentence on what they layer on top of global standards.

### Section pattern (standards modules)

| Label | Purpose |
|-------|---------|
| `# Hard Rules — Read First` | Non-negotiable boundaries, numbered list |
| `# Decision: <Topic>` | What the agent may / must not decide |
| `**Required outcome:**` | Goal the agent must hit |
| `**Not your decision:**` | What the project owns |
| `**Forbidden without approval:**` | Stop-and-ask triggers |
| `**Required:**` | Mandatory behavior |

Language rules:

- Use **must / must not / stop / ask** — not "consider" or "prefer"
- Do not prescribe stack, folder layout, or implementation patterns
- Ask for contracts, schema, and security when facts are missing; proceed when the codebase already shows the pattern

Keep `SKILL.md` an entry point. Put long playbooks in `references/` and link **one level deep** from `SKILL.md`.

Workflow modules may use task-oriented headings instead of `# Decision:` where appropriate, but keep steps explicit and paths POSIX (`scripts/foo.mjs`, not `scripts\foo.py`).

---

## Platform portability

| Portable (skill body) | Tool-specific (metadata only) |
|-----------------------|-------------------------------|
| All markdown under `# Core Principle` | `SKILL.md` YAML frontmatter |
| `references/*.md` content | `rules/global.mdc` frontmatter |
| `AGENTS.md` body (global) | `alwaysApply`, `description` in `.mdc` |

When appending a skill body to non-Cursor tools manually, **strip YAML frontmatter** — paste the markdown body only.

---

## Naming conventions

| Item | Convention | Example |
|------|------------|---------|
| Skill directory | lowercase, hyphens | `api-design/` |
| Cursor skill `name` | lowercase, hyphens | `api-design`, `bar-js` |
| Reference files | lowercase, hyphens | `taxonomy.md`, `detection.md` |
| Section headers | `# Decision:` for boundaries | `# Decision: Scope` |

Avoid vague names: `helper`, `utils`, `tools`.

---

## Publishing a skill pack

1. Create one folder per skill with `SKILL.md` (+ optional `references/`, `scripts/`)
2. Validate frontmatter and trigger terms in `description`
3. Test install in a scratch project:

   ```bash
   npx @vorlaxen-labs/agent-skills add your-org/your-skills-repo -s your-module -y
   ```

4. Optionally list skills in an [agent-skills hub](docs/commands/hub.md) (`agent-skills.hub.json`) for `hub add` / `add hub:<id>`

To change **bundled global** content in this repo, edit `AGENTS.md`, `skills/global/SKILL.md`, and `rules/global.mdc` together — see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Review checklist

### Any external skill

- [ ] Frontmatter `name` and `description` present; description is third person with trigger terms
- [ ] Standards modules open with **Constrain decisions, not implementations**
- [ ] No invented paths, APIs, types, or config keys
- [ ] No vague "consider / prefer / maybe"
- [ ] Body works without Cursor-specific assumptions

### Global sync (this repo only)

- [ ] `AGENTS.md`, `skills/global/SKILL.md`, and `rules/global.mdc` match from `# Core Principle`

---

## Anti-patterns

| Don't | Do instead |
|-------|------------|
| Duplicate global rules in every domain module | Reference global; add domain-only boundaries |
| Prescribe React vs Vue, Express vs Fastify | Constrain decisions; let the project decide |
| Deep reference chains (`SKILL → a → b → c`) | Link directly from SKILL to each reference file |
| Time-sensitive "before August 2025" notes | State current behavior; archive old patterns separately |
| Windows paths | POSIX paths always |

---

## Related docs

- [README.md](README.md) — loader CLI and quick start
- [CONTRIBUTING.md](CONTRIBUTING.md) — developing this repo, global sync
- [AGENTS.md](AGENTS.md) — bundled global standards (reference implementation)
- [docs/integrations.md](docs/integrations.md) — `skills-lock.json` and external sources
