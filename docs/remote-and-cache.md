# Remote source and cache

By default, the CLI uses a **bundled snapshot** shipped with your installed package version. No network required.

## Fetch from GitHub

Use `--remote` on `init` or `update`:

```bash
# Same version tag as the installed CLI (e.g. v1.3.0)
npx @vorlaxen-labs/agent-skills init --remote

# Bleeding-edge from main
npx @vorlaxen-labs/agent-skills init --remote=main
npx @vorlaxen-labs/agent-skills update --remote=main
```

The remote ref is stored in the manifest so later `update` and `diff` calls use the same source unless overridden.

Repository: [vorlaxen-labs/Agent-Skills](https://github.com/vorlaxen-labs/Agent-Skills) on GitHub.

## Response cache

GitHub API responses are cached under `~/.cache/agent-skills/`.

Bypass the cache for a single run:

```bash
npx @vorlaxen-labs/agent-skills init --no-cache
npx @vorlaxen-labs/agent-skills update --no-cache
npx @vorlaxen-labs/agent-skills diff --no-cache
```

## Rate limits

Set `GITHUB_TOKEN` for higher GitHub API rate limits when fetching remotely.
