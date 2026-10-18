# Conflicts and manifest

When agent configuration files already exist (`AGENTS.md`, `.cursor/rules/*`, Claude rules, etc.), the CLI detects conflicts before writing.

## Interactive choices

During `init`, you can choose:

- **Replace** — overwrite with Vorlaxen content
- **Append** — merge with existing content, then choose which content is primary for the agent
- **Skip** — leave your files unchanged

## Non-interactive defaults

With `--yes`, the default is **append** with Vorlaxen content first (`vorlaxen-first`).

Override globally:

```bash
npx @vorlaxen-labs/agent-skills init --on-conflict replace --platform agents-md --skills global
npx @vorlaxen-labs/agent-skills init --on-conflict skip --platform agents-md --skills global
npx @vorlaxen-labs/agent-skills init --on-conflict append --append-order existing-first --yes
```

Per-path override (repeatable):

```bash
npx @vorlaxen-labs/agent-skills init --on-conflict append --on-conflict-for AGENTS.md=append --yes
```

## Conflict modes

| Mode | Behavior |
|------|----------|
| `replace` | Overwrite existing file with Vorlaxen content |
| `append` | Merge existing and Vorlaxen content |
| `skip` | Do not modify the existing file |
| `inherit` | Use policy stored in manifest (used by `update`) |

## Append order

When appending:

| Order | Result |
|-------|--------|
| `vorlaxen-first` | Vorlaxen content appears before existing content |
| `existing-first` | Your content appears before Vorlaxen content |

## Platform manifest (bundled standards)

After `init`, the CLI writes `.agent-skills/manifest.json` (schema v3) with a `$schema` pointer. Normative definition: [docs/schemas/install-manifest-v3.schema.json](../schemas/install-manifest-v3.schema.json) ([overview](../schemas/README.md)).

Fields:

- Platform and bundled skill ids (typically `global` only)
- Remote source settings (if used)
- Conflict policy and per-path overrides
- `writtenBySkill`, `contentHashes`, CLI version

`update`, `remove`, `doctor`, `diff`, and `status` use this file for **bundled** standards. Legacy manifests (v1/v2, retired skill ids) are migrated on read.

## Project lock (integrated skills)

`add` writes **`skills-lock.json`** at the project root (vercel-labs/skills–compatible), with `$schema` set. Normative definition: [docs/schemas/skills-lock-v1.schema.json](../schemas/skills-lock-v1.schema.json) ([overview](../schemas/README.md)).

Fields:

- `source`, `sourceType`, `skillPath`, `computedHash` per skill name
- Commit this file for reproducible integrations

Integrated skills live under `.agents/skills/<name>/` (and `.cursor/skills/` when initialized for Cursor). See [integrations.md](integrations.md).
