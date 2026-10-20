Welcome to **Vorlaxen Agent Skills** — the loader CLI that installs [`AGENTS.md`](https://github.com/vorlaxen-labs/agent-skills/blob/main/AGENTS.md) standards and **agent skills from any GitHub repo** into Cursor, Claude Code, Copilot, Windsurf, Codex, Gemini CLI, and similar tools.

## Quick start

```bash
npx @vorlaxen-labs/agent-skills init
npx @vorlaxen-labs/agent-skills add owner/skills-repo -s skill-name -y
```

- **npm:** [@vorlaxen-labs/agent-skills](https://www.npmjs.com/package/@vorlaxen-labs/agent-skills)
- **Docs:** [Quick start](https://github.com/vorlaxen-labs/agent-skills/blob/main/docs/quick-start.md) · [CLI reference](https://github.com/vorlaxen-labs/agent-skills/tree/main/docs)
- **Authoring skills:** [SKILL-SPEC.md](https://github.com/vorlaxen-labs/agent-skills/blob/main/SKILL-SPEC.md)

---

## FAQ

### How is this different from a skill marketplace?

This repository ships a **loader** plus **bundled global defaults** only. Domain skills live in **separate GitHub repositories**; you integrate them per project with `add` or `hub`.

### Do I need to publish to npm to use skills?

No. Use `npx @vorlaxen-labs/agent-skills` or follow [manual install](https://github.com/vorlaxen-labs/agent-skills/blob/main/docs/manual-install.md).

### What format must external skills use?

Each skill is a folder with `SKILL.md` and valid YAML frontmatter — see [SKILL-SPEC.md](https://github.com/vorlaxen-labs/agent-skills/blob/main/SKILL-SPEC.md).

### Where should I post what?

| Topic | Channel |
|-------|---------|
| How-to, ideas, integrations | **Discussions** (this forum) — [Q&A](https://github.com/vorlaxen-labs/agent-skills/discussions/categories/q-a) for answerable threads |
| Bugs, CLI features | [Issue templates](https://github.com/vorlaxen-labs/agent-skills/issues/new/choose) |
| Security vulnerabilities | [SECURITY.md](https://github.com/vorlaxen-labs/agent-skills/blob/main/SECURITY.md) — **not** public issues |

When reporting problems, include `npx @vorlaxen-labs/agent-skills --version` and the exact commands you ran.

---

## Contribute

See [CONTRIBUTING.md](https://github.com/vorlaxen-labs/agent-skills/blob/main/CONTRIBUTING.md). External skill packs and hub catalogs belong in **your own repos**, not in this tree.
