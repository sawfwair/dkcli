# DECISIONS

## Public repo excludes the website

The public `dkcli` repo contains the CLI, reusable packages, examples, and package verification only. The SvelteKit website, Cloudflare deploy config, DKCMS worker, public routes, static site assets, and web-only docs live in the sibling private workspace at `../dkweb`.

## Color math uses OKLCH

Palette and color utilities are built around OKLCH instead of HSL because the tools are intended to generate perceptually uniform scales and harmonies.

## Contrast uses APCA

The contrast and audit engines use APCA-oriented helpers to better reflect perceptual readability than a WCAG 2 ratio alone.

## CLI source stays explicit

The `dk` command imports concrete modules from `src/lib/dk`. The barrel at `src/lib/dk/index.ts` exists as the package-facing export surface.

## Package boundaries stay directional

`@dkcli/core` owns the framework-agnostic math and proof contracts. `@dkcli/tokens` may depend on `@dkcli/core`. `@dkcli/components` may depend on both packages. The core package must not depend on tokens, components, or Svelte.

## Graphical element contrast uses minLc: 30

Component proof specs for non-text visual indicators use `minLc: 30` on their contrast proofs. Text thresholds are too strict for marks and thumbs that communicate through shape and position.

## Helper text uses a literal font size

Description and error slots in field/choice components use `literal('0.8125rem')` instead of `ref('type.xs')` so compact helper text remains stable across theme ratios.

## Proof matrix validates component themes

`packages/components/src/lib/proof-matrix.test.ts` validates components across gallery themes. This catches contrast, layout, target-size, and motion regressions that single-theme unit tests miss.
