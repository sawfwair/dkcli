# DesignKit CLI

[![CI](https://github.com/sawfwair/dkcli/actions/workflows/ci.yml/badge.svg)](https://github.com/sawfwair/dkcli/actions/workflows/ci.yml)
[![Packages](https://github.com/sawfwair/dkcli/actions/workflows/packages.yml/badge.svg)](https://github.com/sawfwair/dkcli/actions/workflows/packages.yml)
[![Docs](https://github.com/sawfwair/dkcli/actions/workflows/docs.yml/badge.svg)](https://github.com/sawfwair/dkcli/actions/workflows/docs.yml)
[![npm version](https://img.shields.io/npm/v/%40dkcli%2Fcli?color=%23af6100)](https://www.npmjs.com/package/@dkcli/cli)

DesignKit generates palettes, type and spacing scales, CSS tokens, and component
proof reports for designers and frontend developers.

Proof reports evaluate mathematical constraints. CSS audits analyze source
declarations and inferred backgrounds. Neither establishes rendered accessibility.
For evidence scope and strict checks, see [Proof-driven design](docs/guides/proof-driven-design.md).

## Install the CLI

To install the published CLI, run:

```bash
npm install -g @dkcli/cli
```

## Generate design outputs

The following commands generate a design proof, a palette, a fluid scale, and a
source CSS audit:

```bash
dk perfect --seed "#D96F32" --ratio perfect-fourth --motion snappy
dk palette "#D96F32" --harmony split-complementary --json
dk scale --fluid --ratio perfect-fourth --base-min 15 --base-max 19
dk audit --css CSS_FILE
```

Replace `CSS_FILE` with the path to a CSS file.

To enforce failed or unsupported checks in CI, add `--strict` to supported proof
and audit commands. Artifact generation without `--strict` can return a report
that contains failures.

## Packages

The workspace contains these packages:

- `@dkcli/cli`: the `dk` and `dkcli` command-line tools
- `@dkcli/core`: design math, proof contracts, and component recipe compilation
- `@dkcli/tokens`: theme generation and CSS and JSON emitters
- `@dkcli/components`: Svelte 5 components with compiled recipes and themes

## Command families

The following table groups the commands by purpose:

| Family | Commands | Purpose |
| --- | --- | --- |
| Proof | `perfect`, `contrast`, `target`, `audit` | Evaluate design constraints and source CSS |
| Foundations | `palette`, `distinct`, `scale`, `text`, `typeset`, `linebreak` | Generate color and type systems |
| Motion | `ease`, `jerk` | Generate motion curves |
| Layout | `layout`, `compose`, `saliency`, `future` | Solve layout constraints and estimate composition metrics |
| Projects | `project verify`, `project qualify`, `project patch` | Verify, measure, and revise portable theme projects |
| Components and content | `components`, `cms` | Verify recipes and manage DKCMS content |

## Author and qualify a theme

Theme projects record font stacks, semantic tokens, motion settings, viewport
widths, revisions, reviews, and measured browser evidence. The workbench and CLI
compile the same public engine. Browser qualification uses a running workbench
and binds its results to the authored inputs and exact package artifacts.

For the format, commands, and evidence scope, see
[Theme projects](docs/guides/theme-projects.md). A portable example is in
[Theme project examples](examples/theme-projects/README.md).

## Run the examples

Both examples install package tarballs built from this checkout:

- [Svelte starter](examples/svelte-starter/): field entry, selection, save, and clear
- [Release desk](examples/sveltekit-starter/README.md): a SvelteKit demo with release
  creation, review, filters, server validation, and theme preferences

To build and verify Release desk, run:

```bash
pnpm example:sveltekit:verify
```

In **Appearance**, import theme JSON exported from the workbench.

## Develop locally

Use Node.js 22 and pnpm 10.33.0.

1. To activate the repository's pnpm version, run:

   ```bash
   corepack enable
   corepack prepare pnpm@10.33.0 --activate
   ```

2. To install dependencies, run:

   ```bash
   pnpm install --frozen-lockfile
   ```

3. To inspect source CLI commands, run:

   ```bash
   pnpm dk --help
   ```

4. To verify code changes, run:

   ```bash
   pnpm preflight
   ```

## Verify a release

Before publishing packages, run:

```bash
pnpm release:verify
```

The gate checks lint, types, tests, builds, package metadata, and tarball contents.
It also verifies the standalone CLI and both example apps from packed artifacts.
Release desk checks include server actions and Chromium flows with and without
JavaScript.

## Documentation

The documentation build generates its theme through the source CLI. To build the
VitePress site, run:

```bash
pnpm docs:build
```

For development and package guidance, see these documents:

- [Documentation site](https://dkcli.com)
- [Getting started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

DesignKit uses the [MIT License](LICENSE).
