# Integrations

The loader ships **global** engineering standards only. All other skills come from external sources and are recorded in the project root `skills-lock.json` (compatible with the [vercel-labs/skills](https://github.com/vercel-labs/skills) lock format). JSON Schema: [skills-lock-v1.schema.json](schemas/skills-lock-v1.schema.json).

## Add from GitHub

```bash
npx @vorlaxen-labs/agent-skills add vercel-labs/agent-skills -s web-design-guidelines -y
npx @vorlaxen-labs/agent-skills add owner/private-skills --ref main -y
```

Set `GITHUB_TOKEN` for higher rate limits on GitHub API fetches.

## Add from a hub

```bash
npx @vorlaxen-labs/agent-skills hub add vorlaxen-skills-hub
npx @vorlaxen-labs/agent-skills add hub:vorlaxen-skills-hub -s bar-js -y
npx @vorlaxen-labs/agent-skills hub update vorlaxen-skills-hub --skills
```

- **`hub remove`** drops a subscription only; use **`remove`** to delete installed skill files.
- **`hub update --skills`** refreshes catalog cache and reinstalls matching lock entries. Top-level **`update`** applies to bundled `init` manifest skills, not hub lock entries.

See [`hub`](commands/hub.md).

## Add from a local path

```bash
npx @vorlaxen-labs/agent-skills add ./path/to/skills-pack -s my-skill -y
```

## Layout

Integrated skills are materialized under:

- `.agents/skills/<name>/` — cross-client convention
- `.cursor/skills/<name>/` — when the project was initialized for Cursor

Commit `skills-lock.json` so CI and teammates get reproducible installs.

## Remove

```bash
npx @vorlaxen-labs/agent-skills remove my-skill -y
```

Bundled standards use `remove global` (requires `init` manifest).

## Skill format

External repos must match the layout in [SKILL-SPEC.md](../SKILL-SPEC.md): each skill is a folder with `SKILL.md` and valid `name` / `description` frontmatter.
