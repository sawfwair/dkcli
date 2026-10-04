# Get started

Use this guide to run DesignKit from source and generate mathematical design artifacts. Repository development uses Node.js 22 and pnpm 10.33.0.

This documentation describes the source checkout. npm releases can differ from local changes. To qualify those changes before publication, use the repository commands.

## Set up the repository

From the repository root, install the pinned dependencies:

```bash
pnpm install --frozen-lockfile
```

To list the source CLI commands, run:

```bash
pnpm dk --help
```

## Generate a combined result

The `perfect` command combines palette, contrast, fluid scale, motion, layout, typography, interaction-target estimates, and line-breaking results:

```bash
pnpm dk perfect --seed "#295dff" --ratio perfect-fourth --motion snappy
```

For machine-readable output, add `--json`:

```bash
pnpm dk perfect --seed "#295dff" --ratio perfect-fourth --motion snappy --json
```

## Generate individual artifacts

To generate a palette, fluid scale, and typography recommendation, run:

```bash
pnpm dk palette "#D96F32" --harmony split-complementary
pnpm dk scale --fluid --ratio perfect-fourth --base-min 15 --base-max 19
pnpm dk text --font 18 --measure 680 --contrast 72
```

The `scripts/generate-docs-design.mjs` file uses these commands to generate the documentation theme.

## Verify local package changes

To run linting, type checks, tests, builds, package checks, and isolated consumer checks, run:

```bash
pnpm release:verify
```

For the individual checks and browser setup, see [Release workflow](/guides/release-workflow). A passing local gate does not publish packages.

## Run an npm release

To install a registry release, run:

```bash
npm install -g @dkcli/cli
```

To inspect a registry release without a global installation, run:

```bash
npx @dkcli/cli --help
```
