# Contributing

This guide describes setup and verification for DesignKit contributors.

## Set up the repository

Use Node.js 22 and pnpm 10.33.0.

1. To activate pnpm, run:

   ```bash
   corepack enable
   corepack prepare pnpm@10.33.0 --activate
   ```

2. To install the pinned dependencies, run:

   ```bash
   pnpm install --frozen-lockfile
   ```

3. To inspect CLI commands, run:

   ```bash
   pnpm dk --help
   ```

## Verify changes

For code changes, run the lint, strict type, unit test, and coverage checks:

```bash
pnpm preflight
```

For documentation changes, build the site:

```bash
pnpm docs:build
```

For package or release changes, run the full verification gate:

```bash
pnpm release:verify
```

The release gate includes package builds, metadata checks, dry packs, tarball
checks, and both example apps. To inspect recipe results, run
`pnpm dk components verify --all`. Some mathematical estimates fail the reviewed
baseline; the gate checks those results separately from browser behavior.

## Repository boundaries

- Keep design math deterministic and free of side effects.
- Keep the website, Cloudflare deployment configuration, and DKCMS worker in
  the private `../dkweb` workspace.
- Regenerate build output and package tarballs through their scripts.
- Exclude access tokens, `.env` files, `.npmrc` files, and private deployment files from
  commits.
- For package content changes, update the package documentation and verify
  tarball contents.

## Documentation and UI text

Use the [Google developer documentation style guide](https://developers.google.com/style).
Apply these project rules:

- Use sentence case, active voice, and present tense.
- State the goal or condition before an instruction.
- Use bold for UI labels and code font for literal names and values.
- Omit shell prompts from copyable command blocks.
- Remove slogans, repeated instructions, and descriptions of obvious controls.
- Retain input formats, error recovery, storage limits, and evidence scope.
- Describe implemented behavior. Keep dated historical assessments separate
  from usage instructions.

## Submit a pull request

Include these details in the description:

- The problem and resulting behavior
- Verification commands and results
- Remaining work that affects review or release

For sensitive reports, follow the [Security policy](SECURITY.md).
