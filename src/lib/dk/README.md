# `src/lib/dk`

This directory contains DesignKit CLI orchestration and design calculations.
Keep calculation functions deterministic. CLI modules handle file, terminal,
and network operations.

The sibling `../dkweb` workspace contains the website and browser runtime.

## Modules

The modules include the following:

- `cli.ts`: Command parsing, help, and output
- `cms-cli.ts`: CMS authentication and publishing commands
- `color.ts`: Color conversion, gamut clipping, contrast ratios, and APCA checks
- `compose.ts`: Composition heuristics for balance, symmetry, alignment, rhythm, and density
- `design.ts`: The `DesignDocument` schema
- `layout.ts`: Stack constraints with minimum, preferred, and maximum sizes
- `palette.ts`: Tonal scales, neutral scales, semantic tokens, and color harmony
- `perception.ts`: Color differences and color vision deficiency simulation
- `scale.ts`: Modular, Fibonacci, and fluid spacing and type scales
- `glass.ts`: CSS generation for layered glass effects
- `interaction.ts`: Fitts, Hick-Hyman, and steering law estimates
- `optical.ts`: Optical correction presets
- `ease.ts`: Spring physics and Bézier-to-linear conversion
- `jerk.ts`: Minimum-jerk motion sampling and CSS export
- `linebreak.ts`: Dynamic programming for balanced line breaks
- `typography.ts`: Text spacing and line length recommendations
- `audit.ts`: Source CSS extraction, heuristic scores, and output formatting
- `saliency.ts`: Importance estimates for `DesignDocument` inputs
- `typeset.ts`: Paragraph width estimates, line wrapping, and streaming line flow
- `future.ts`: Content clustering and layout estimates from embeddings
- `future-text.ts`: Semantic paragraph layout experiments
- `index.ts`: Public exports

## Rules

- Keep DOM and network operations outside calculation modules.
- Keep public functions typed explicitly.
- Add or update a matching `*.test.ts` file when behavior changes.
- Split modules when they gain responsibilities outside their scope.
