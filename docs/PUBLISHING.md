# Publishing (@vorlaxen-labs/agent-skills)

Production releases are **fully automated** on push to `main` via GitHub Actions and [semantic-release](https://semantic-release.gitbook.io/). You do **not** need a `.env` file in the repo for CI.

This matches the [@vorlaxen-labs/bar-js](https://github.com/vorlaxen-labs/bar-js) pipeline: **Trusted Publishing (OIDC)**, not a long-lived publish token in the publish step.

## One-time setup (required)

### 1. npm package access

- Scope: `@vorlaxen-labs`
- Package: `@vorlaxen-labs/agent-skills`
- Public access is set in `package.json` → `publishConfig.access`.

### 2. GitHub repository secret

In **GitHub → vorlaxen-labs/Agent-Skills → Settings → Secrets and variables → Actions**:

| Secret      | Value |
|-------------|--------|
| `NPM_TOKEN` | **Not used for publish** when Trusted Publishing is set up. Optional read token only if you install private deps in CI. |

Publish auth is **OIDC** via [Trusted Publishing](https://docs.npmjs.com/trusted-publishers).

`GITHUB_TOKEN` is provided automatically by Actions.

### 3. npm Trusted Publisher (required for CI publish)

On [npmjs.com](https://www.npmjs.com) → **@vorlaxen-labs/agent-skills** → **Settings** → **Trusted publishing**:

1. Provider: **GitHub Actions**
2. Organization / user: `vorlaxen-labs`
3. Repository: `Agent-Skills`
4. **Workflow filename:** `publish.yml` (filename only)
5. Environment: (leave empty unless you use GitHub Environments)

Save, then re-run the failed **Publish Package** workflow if needed.

The publish job does **not** pass `registry-url` to `setup-node` (that pattern breaks OIDC). Do not rely on `NODE_AUTH_TOKEN` for `npm publish` in CI.

### 4. Branch and commits

- Default release branch: **`main`**
- Use [Conventional Commits](https://www.conventionalcommits.org/):
  - `fix:` → patch
  - `feat:` → minor
  - `feat!:` or footer `BREAKING CHANGE:` → major

## What CI does

1. **Pull requests:** `npm run ci` (sync, bundled snapshot, tests).
2. **Push to `main`:** same checks, then **Publish Package** runs semantic-release:
   - Computes next version from commits since last git tag
   - Runs `prepublishOnly` (`build` + `ci`) during `npm publish`
   - Publishes to npm with provenance
   - Creates a GitHub Release
   - Commits `package.json` + `package-lock.json` with `[skip ci]`

Manual tag push (`git push origin v*`) is **not** used anymore.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| OIDC `404 package not found` on publish | Trusted Publisher not linked for `@vorlaxen-labs/agent-skills`, or wrong repo / workflow filename |
| `403` + bypass 2FA | Use Trusted Publishing instead of a granular token without bypass |
| No release after push to `main` | No conventional commit since last tag; run `npm run release:dry-run` locally |
| `bundled/ is out of date` in CI | `npm run ci` runs `build` before `check:bundled` — ensure `main` is green |

## Local dry-run

```bash
npm ci
npm run release:dry-run
```

Prefer **CI on `main`** so version tags, GitHub releases, and npm stay in sync.
