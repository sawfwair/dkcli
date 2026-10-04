# Codebase

This reference maps the public CLI source for DesignKit contributors.

## Source directories

The repository contains these entry points and modules:

- `src/bin/dk.ts`: package entry point compiled to `dist/bin/dk.js`
- `src/lib/dk/cli.ts`: command parsing and dispatch
- `src/lib/dk/cms-cli.ts`: DKCMS command client
- `src/lib/dk`: CLI adapters and compatibility exports of public core algorithms
- `src/lib/dkcms`: typed DKCMS payload and token helpers
- `packages/core`: design math, project and qualification contracts, and recipe compilation
- `packages/tokens`: preset and authored theme generation and CSS and JSON emitters
- `packages/components`: Svelte 5 components
- `examples/svelte-starter`: an interactive package consumer
- `examples/sveltekit-starter`: a server-rendered package consumer

The private `../dkweb` workspace contains the browser workbench and DKCMS worker.
Its workbench installs exact public tarballs. Its math modules export the same
public core algorithms as the CLI. Project qualification measures the private
browser scenes while sharing public validation, identity, and fixture contracts.

See [Theme projects](docs/guides/theme-projects.md) for portable inputs and
[Implementation milestone](PROJECT-WORKFLOW.md) for the coordinated scope.

## Verify changes

For source changes, run `pnpm preflight`. For package changes, run
`pnpm release:verify`. For setup and documentation rules, see
[Contributing](CONTRIBUTING.md).

Regenerate `dist`, package tarballs, caches, and coverage output through the
repository scripts.
