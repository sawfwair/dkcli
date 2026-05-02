# DesignKit CLI

[![CI](https://github.com/sawfwair/dkcli/actions/workflows/ci.yml/badge.svg)](https://github.com/sawfwair/dkcli/actions/workflows/ci.yml)
[![Packages](https://github.com/sawfwair/dkcli/actions/workflows/packages.yml/badge.svg)](https://github.com/sawfwair/dkcli/actions/workflows/packages.yml)
[![Docs](https://github.com/sawfwair/dkcli/actions/workflows/docs.yml/badge.svg)](https://github.com/sawfwair/dkcli/actions/workflows/docs.yml)
[![npm](https://img.shields.io/npm/v/%40dkcli%2Fcli?color=%23af6100)](https://www.npmjs.com/package/@dkcli/cli)

Proof-driven design tooling for teams that want interface decisions to leave evidence behind.

DesignKit ships a deterministic CLI and package workspace for OKLCH palettes, APCA contrast, fluid scales, motion curves, optical corrections, layout rails, composition scoring, typography recommendations, CSS audits, token emission, and Svelte 5 component recipes.

## Docs

- Public site: [dkcli.com](https://dkcli.com)
- GitHub Pages workflow: [.github/workflows/docs.yml](.github/workflows/docs.yml)
- VitePress source: [docs/](docs/)
- Docs theme proof artifacts: [docs/.vitepress/theme/generated](docs/.vitepress/theme/generated)

The docs site uses DesignKit itself. `pnpm docs:build` runs `scripts/generate-docs-design.mjs`, which invokes the local `dk` CLI to generate the docs palette, fluid scale, typography rhythm, motion curve, and proof JSON before VitePress builds.

## Install

```bash
npm install -g @dkcli/cli
```

Or run it one-off:

```bash
npx @dkcli/cli --help
```

Inside this repository, use the source-owned wrapper:

```bash
pnpm install
pnpm dk --help
```

## Quick Start

```bash
dk perfect --seed "#D96F32" --ratio perfect-fourth --motion snappy
dk palette "#D96F32" --harmony split-complementary --json
dk scale --fluid --ratio perfect-fourth --base-min 15 --base-max 19
dk text --font 18 --measure 680 --contrast 72
dk audit --css app.css
```

## Packages

- `@dkcli/cli`: the `dk` and `dkcli` command line tools.
- `@dkcli/core`: framework-agnostic math, proofs, specs, and recipe compilation.
- `@dkcli/tokens`: compiled themes, token aliases, and CSS/JSON emitters.
- `@dkcli/components`: Svelte 5 components backed by DesignKit recipes and themes.

## Command Families

| Family | Commands | Purpose |
| --- | --- | --- |
| Proof | `perfect`, `contrast`, `target`, `audit` | Generate evidence for readability, interaction burden, CSS quality, and complete design states. |
| Foundations | `palette`, `distinct`, `scale`, `text`, `typeset`, `linebreak` | Build color, spacing, and typography systems with measurable constraints. |
| Motion | `ease`, `jerk` | Convert spring physics and minimum-jerk motion into CSS-ready curves. |
| Layout | `layout`, `compose`, `saliency`, `future` | Solve rails, score composition, and explore content topology. |
| Product | `components`, `cms` | Verify component recipes and manage hosted DKCMS content. |

## Local Development

Use Node 22 or newer and pnpm 10.33.0.

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
pnpm lint
pnpm check:strict
pnpm test
pnpm build
```

## Docs Development

```bash
pnpm docs:tokens
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```

`docs:tokens` is safe in a fresh checkout: it builds the workspace packages required by the local CLI before generating docs tokens.

## Release Checks

Run the full public release gate before publishing packages or tagging a release:

```bash
pnpm release:verify
```

This runs linting, strict checks, tests, builds, package verification, dry packs, package-content checks, and starter verification.

## Architecture

- `src/bin/dk.ts` is the publishable CLI entrypoint compiled into `dist/bin/dk.js`.
- `bin/dk.js` is the local development wrapper used by docs and source commands.
- `src/lib/dk` contains deterministic CLI helpers and command implementations.
- `src/lib/dkcms` contains typed payload helpers used by `dk cms` commands.
- `packages/core` contains framework-agnostic design math and proof contracts.
- `packages/tokens` emits theme tokens and CSS/JSON artifacts.
- `packages/components` contains the Svelte component package.
- `examples/svelte-starter` verifies the published package tarballs in a small consumer app.

## Contributing And Security

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.
- Report sensitive security issues through [SECURITY.md](SECURITY.md).
- Do not commit `.env` files, `.npmrc`, service tokens, or deployment overlays.

Released under the [MIT License](LICENSE).
