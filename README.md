# DesignKit CLI

DesignKit CLI is the public package workspace for deterministic design tooling. It ships math and utilities for palettes, scales, APCA contrast, layout, motion, typography, CSS auditing, component recipes, theme tokens, and Svelte 5 components.

## Packages

- `@dkcli/cli`: the `dk` and `dkcli` command line tools.
- `@dkcli/core`: framework-agnostic math, proofs, specs, and recipe compilation.
- `@dkcli/tokens`: compiled themes, token aliases, and CSS/JSON emitters.
- `@dkcli/components`: Svelte 5 components backed by DesignKit recipes and themes.

Install the CLI globally with `npm install -g @dkcli/cli`, or run it one-off with `npx @dkcli/cli --help`.

## Setup

- Use Node 22 or newer. CI runs Node 22, and `.node-version` pins that default.
- Use pnpm 10.33.0. The root `package.json` declares this with `packageManager`.
- If pnpm is not available, run `corepack enable` and then `corepack prepare pnpm@10.33.0 --activate`.
- Run `pnpm install`.
- Run `pnpm dk --help` for the source-owned CLI wrapper.

## Runbook

- `pnpm build` emits the publishable CLI package files to `dist/`.
- `pnpm build:packages` builds `@dkcli/core`, `@dkcli/tokens`, and `@dkcli/components`.
- `pnpm pack:dry` previews the CLI npm tarball contents after the build.
- `pnpm lint` runs ESLint with zero-warning tolerance.
- `pnpm check:strict` typechecks the CLI and Svelte component package.
- `pnpm test` runs the Vitest suite.
- `pnpm test:coverage` runs Vitest with the configured coverage thresholds.
- `pnpm release:verify` runs the package release gate.

## Public Release Checks

Run these before publishing packages or tagging a public release:

```bash
pnpm release:verify
pnpm dk components verify --all
pnpm audit --audit-level low
pnpm licenses list --prod
```

## Architecture

- `src/bin/dk.ts` is the publishable CLI entrypoint compiled into `dist/bin/dk.js`.
- `src/lib/dk` contains the CLI-facing deterministic helpers and command implementation.
- `src/lib/dkcms` contains typed payload helpers used by `dk cms` commands.
- `packages/core` contains framework-agnostic design math and proof contracts.
- `packages/tokens` emits theme tokens and CSS/JSON artifacts.
- `packages/components` contains the Svelte component package.
- `examples/svelte-starter` verifies the published package tarballs in a small consumer app.

## Hosted Service Commands

The `dk cms` command group is a public client for the hosted DKCMS service. It contains request/response types, authentication helpers, and endpoint paths.

## Contributing And Security

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.
- Report sensitive security issues through [SECURITY.md](SECURITY.md).
- Do not commit `.env` files, `.npmrc`, service tokens, or deployment overlays.
