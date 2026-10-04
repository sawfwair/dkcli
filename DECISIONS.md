# Design decisions

This document records implementation constraints for DesignKit contributors.

## Repository ownership

The public `dkcli` repository owns the CLI, packages, examples, and package
publication. The private `dkweb` workspace owns the workbench, web runtime,
Cloudflare configuration, and DKCMS worker. Workbench qualification uses
installed public artifacts.

## Color models

Palette generation uses OKLCH for perceptually uniform scales and harmonies.
Contrast constraints use the Accessible Perceptual Contrast Algorithm (APCA).
A mathematical contrast result is separate from a rendered accessibility
assessment.

## Module imports

CLI implementations import concrete modules from `src/lib/dk`.
The `src/lib/dk/index.ts` file defines the package export surface.

## Package dependencies

`@dkcli/tokens` can depend on `@dkcli/core`. `@dkcli/components` can depend on
both packages. Core must remain independent of tokens, components, and Svelte.

## Component constraints

Graphical indicators use `minLc: 30` in their contrast specifications.
Description and error slots use `literal('0.8125rem')` to keep helper text sizes
consistent across theme ratios.

## Proof verification

The component matrix evaluates registered components across gallery themes.
The public baseline retains failing width estimates. Tests verify those verdicts
and coverage without treating mathematical results as browser measurements.

The CLI writes proof artifacts before enforcing `--strict` failure exits.
Consumer gates verify package declarations, server rendering, and interactions
separately from mathematical constraints.
