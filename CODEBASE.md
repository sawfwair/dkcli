# CODEBASE

DesignKit CLI is the public package workspace for the `dk` command and related npm packages.

- `src/bin/dk.ts`: package entrypoint compiled to `dist/bin/dk.js`
- `src/lib/dk/cli.ts`: command parser and top-level command dispatch
- `src/lib/dk/cms-cli.ts`: remote DkCms command client
- `src/lib/dk/*.ts`: CLI-facing design helpers
- `src/lib/dkcms/*.ts`: typed DkCms payload and token helpers shared by CLI commands
- `packages/core`: framework-agnostic math, specs, proofs, and recipe compilation
- `packages/tokens`: theme creation plus CSS/JSON token emitters
- `packages/components`: Svelte 5 component package
- `examples/svelte-starter`: package consumer smoke test

Run these before shipping changes:

- `pnpm lint`
- `pnpm check:strict`
- `pnpm test`
- `pnpm build`
- `pnpm release:verify`

Do not touch `dist/`, package tarballs, cache folders, or generated coverage output by hand.
