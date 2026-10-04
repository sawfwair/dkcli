# Core package

For library developers, `@dkcli/core` provides framework-independent design calculations and recipe compilation.

## Package responsibilities

The package contains the following modules:

- Color conversion, gamut clipping, APCA, and perceptual distinctness
- Modular, Fibonacci, and fluid scales
- Motion curves, optical corrections, interaction targets, layout, composition, typography, and line breaking
- Design schemas, recipe contracts, mathematical checks, and audit helpers

## Contributor requirements

Keep core functions deterministic and free of DOM or network access. Type public APIs explicitly and test behavior changes.

Mathematical and heuristic results do not establish rendered browser behavior or accessibility compliance.

## Source locations

Reusable modules live in `packages/core/src`. CLI commands and adapters live in `src/lib/dk`.
