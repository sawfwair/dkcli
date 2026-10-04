# Repository architecture

For package contributors, this page describes the CLI entry points, reusable packages, and documentation build.

## Workspace layout

The workspace contains the following entry points and consumers:

- `src/bin/dk.ts`: the CLI entry point compiled into `dist/bin/dk.js`
- `bin/dk.js`: the local source wrapper
- `src/lib/dk`: CLI commands and adapters
- `src/lib/dkcms`: typed payload helpers for hosted DKCMS commands
- `packages`: reusable package source and build outputs
- `examples/svelte-starter`: an interactive consumer of local tarballs
- `examples/sveltekit-starter`: a server-rendered consumer of local tarballs

## Package dependencies

The packages and examples use the following DesignKit dependencies:

| Consumer | DesignKit dependencies |
| --- | --- |
| `@dkcli/core` | No other DesignKit packages |
| `@dkcli/tokens` | `@dkcli/core` |
| `@dkcli/components` | `@dkcli/core` and `@dkcli/tokens` |
| `@dkcli/cli` | Bundles its design and component-verification implementation during its build |
| Consumer examples | Installed `@dkcli/core`, `@dkcli/tokens`, and `@dkcli/components` artifacts |

## Deterministic functions

Keep core design functions deterministic and free of side effects. Put network requests and hosted-service behavior in CLI adapters or `src/lib/dkcms`.

CLI and workbench math modules export the public core engine. Portable project
validation, content identity, history, token-patch contracts, and browser-receipt
validation also live in public core. The tokens package compiles authored project
themes. The private workbench measures hydrated component scenes through its local
Chromium or Cloudflare browser adapter.

See [Theme projects](guides/theme-projects.md) for commands and evidence scope.

## Build the documentation

To build the documentation, run `pnpm docs:build`. The command follows this sequence:

1. Run `pnpm docs:tokens` with `scripts/generate-docs-design.mjs`.
2. Invoke the local CLI's `perfect`, `palette`, `scale`, `text`, and `target` commands.
3. Write `dk-tokens.css` and `dk-proof.json` to the generated theme directory.
4. Build VitePress with the generated artifacts.
