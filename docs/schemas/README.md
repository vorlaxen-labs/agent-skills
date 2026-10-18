# JSON Schemas

Normative schemas for files written and read by `@vorlaxen-labs/agent-skills`. Use them in editors, CI, or third-party tooling.

| File | Schema | Written by |
|------|--------|------------|
| `.agent-skills/manifest.json` | [install-manifest-v3.schema.json](./install-manifest-v3.schema.json) | `init`, `update` |
| `skills-lock.json` | [skills-lock-v1.schema.json](./skills-lock-v1.schema.json) | `add`, `remove` |
| `agent-skills.hub.json` (remote) | [agent-skills-hub-v1.schema.json](./agent-skills-hub-v1.schema.json) | hub repos |
| `agent-skills-hubs.json` | [agent-skills-hubs-subscription-v1.schema.json](./agent-skills-hubs-subscription-v1.schema.json) | `hub add`, `hub remove` |

Legacy bundled manifests without `schemaVersion` or with `schemaVersion` 1–2 are **not** valid against v3; the CLI migrates them on read. See [install-manifest-legacy.schema.json](./install-manifest-legacy.schema.json) for the older shapes.

## `$schema` in project files

The CLI sets `$schema` on newly written manifests and lock files to the canonical URL on `main`:

- Bundled install: `https://raw.githubusercontent.com/vorlaxen-labs/Agent-Skills/main/docs/schemas/install-manifest-v3.schema.json`
- Integrated skills lock: `https://raw.githubusercontent.com/vorlaxen-labs/Agent-Skills/main/docs/schemas/skills-lock-v1.schema.json`

For offline or pinned validation, point `$schema` at a path inside this repo (or a copy in your project):

```json
{
  "$schema": "./node_modules/@vorlaxen-labs/agent-skills/docs/schemas/skills-lock-v1.schema.json",
  "version": 1,
  "skills": {}
}
```

## `skills-lock.json` and vercel-labs/skills

The lock schema matches the fields this CLI reads and writes: `source`, `sourceType`, `skillPath`, `computedHash`, optional `ref` and `sourceUrl`. Other tools may add fields; this schema uses `additionalProperties: true` on lock entries so forward-compatible clients can coexist.

## Validation in CI

Example with [ajv-cli](https://github.com/ajv-validator/ajv-cli):

```bash
npx ajv-cli validate \
  -s docs/schemas/skills-lock-v1.schema.json \
  -d skills-lock.json \
  --spec=draft2020
```

Bundled manifest (after `init`):

```bash
npx ajv-cli validate \
  -s docs/schemas/install-manifest-v3.schema.json \
  -d .agent-skills/manifest.json \
  --spec=draft2020
```
