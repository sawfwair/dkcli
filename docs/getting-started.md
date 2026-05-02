# Getting Started

DesignKit is easiest to understand as a loop: choose a seed, generate evidence, wire the useful bits into your app, then keep the proof output close to your components.

## Install

```bash
npm install -g @dkcli/cli
# or run one-off
npx @dkcli/cli --help
```

Inside this repository, use the source-owned wrapper:

```bash
pnpm install
pnpm dk --help
```

## Generate A Proof State

`dk perfect` composes multiple systems into one proof state: palette, contrast, fluid scale, motion, layout, typography, target burden, and line breaking.

```bash
pnpm dk perfect --seed "#295dff" --ratio perfect-fourth --motion snappy
```

Use JSON when you want to pipe the result into another tool:

```bash
pnpm dk perfect --seed "#295dff" --ratio perfect-fourth --motion snappy --json
```

## Generate A Theme

```bash
pnpm dk palette "#D96F32" --harmony split-complementary
pnpm dk scale --fluid --ratio perfect-fourth --base-min 15 --base-max 19
pnpm dk text --font 18 --measure 680 --contrast 72
```

This docs site uses exactly that pattern in `scripts/generate-docs-design.mjs`.

## Verify Before Release

```bash
pnpm lint
pnpm check:strict
pnpm test
pnpm build
pnpm build:packages
pnpm publint
pnpm pack:packages:dry
pnpm example:verify
```

For the full package gate, run:

```bash
pnpm release:verify
```
