# Contributing

Thanks for helping improve DesignKit.

## Local Setup

- Use Node 22 or newer. CI runs Node 22, and `.node-version` pins that default.
- Use pnpm 10.33.0. The root `package.json` declares this with `packageManager`.
- If pnpm is not available, run `corepack enable` and `corepack prepare pnpm@10.33.0 --activate`.
- Install dependencies with `pnpm install`.
- Run the source CLI with `pnpm dk --help`.

## Verification

Before opening a PR, run the checks that match the change:

- `pnpm lint`
- `pnpm check:strict`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm build`
- `pnpm build:packages`
- `pnpm publint`
- `pnpm pack:packages:dry`
- `pnpm check:package-contents`
- `pnpm example:verify`

For release-oriented changes, run:

```bash
pnpm release:verify
pnpm dk components verify --all
pnpm audit --audit-level low
pnpm licenses list --prod
```

The default agent-readiness gate is:

```bash
pnpm preflight
```

This command is intentionally narrower than `pnpm release:verify`: it blocks on lint, strict TypeScript/component checks, unit tests, and coverage.

## Project Boundaries

- Keep pure design math in `src/lib/dk` deterministic and side-effect free.
- Keep the website, Cloudflare deploy config, and DKCMS worker in the private `../dkweb` workspace.
- Do not edit `dist/`, cache folders, generated coverage output, or generated package tarballs.
- Do not commit access tokens, `.env` files, or `.npmrc` files.
- If package contents change, update the package README or changelog and run the pack dry-run checks.

## Pull Requests

Please include:

- What changed and why.
- The commands you ran.
- Any follow-up work that should not block the PR.
