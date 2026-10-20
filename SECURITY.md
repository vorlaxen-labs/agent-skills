# Security Policy

## Supported versions

Security fixes are published for the **latest release** on npm (`@vorlaxen-labs/agent-skills`) and the `main` branch of this repository.

| Version | Supported |
| ------- | --------- |
| Latest npm release | Yes |
| Older major/minor | Best effort only |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security problems.**

1. Use [GitHub private vulnerability reporting](https://github.com/vorlaxen-labs/agent-skills/security/advisories/new) for this repository, **or**
2. Email the maintainers via the contact path listed on [npm `@vorlaxen-labs/agent-skills`](https://www.npmjs.com/package/@vorlaxen-labs/agent-skills) if private reporting is unavailable.

Include:

- A clear description of the issue and impact
- Steps to reproduce (CLI commands, sample repos, or minimal project layout)
- Affected version(s)
- Any suggested fix or mitigation, if you have one

We aim to acknowledge reports within **5 business days** and will coordinate disclosure once a fix is available.

## Scope

This policy covers the **loader CLI**, bundled global standards, documentation, and JSON schemas in this repo. Skills installed from **third-party GitHub repositories** via `add` or `hub` are maintained by their authors — report those issues to the skill source repo when appropriate.

## Safe usage

- Treat remote skill repos as **untrusted content** until you review them; use `doctor` and lock files (`skills-lock.json`) for reproducibility.
- Do not commit secrets into skill repos or project manifests; the CLI should never require credentials for public GitHub sources.
