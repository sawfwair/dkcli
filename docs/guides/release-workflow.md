# Release Workflow

The release gate favors boring, repeatable confidence.

## Local Gate

```bash
pnpm release:verify
```

This runs linting, strict checks, tests, builds, package verification, dry packs, package-content checks, and starter verification.

## GitHub Actions

- `CI` runs lint, typecheck, tests, coverage, and build.
- `Packages` builds and validates publishable packages.
- `Example Starter` verifies the starter against packed artifacts.
- `Release` verifies and publishes via Changesets or versioned package changes.
- `Docs` builds VitePress and deploys to GitHub Pages.

## Publish Safety

Do not commit `.env`, `.npmrc`, service tokens, or deployment overlays. Use GitHub and npm secrets for release credentials.
