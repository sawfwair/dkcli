# @dkcli/core

`@dkcli/core` is the framework-agnostic engine room.

## Responsibilities

- Color conversion, gamut clipping, APCA, and perceptual distinctness.
- Modular, fibonacci, and fluid scales.
- Motion curves, optical corrections, target analysis, layout, composition, typography, and line breaking.
- Design-system schemas, recipe contracts, proof runners, and audit helpers.

## Rules

- No DOM access.
- No network access.
- Deterministic output for the same input.
- Public APIs typed explicitly.
- Matching tests for behavior changes.

## Source Map

Most CLI-facing core logic currently lives in `src/lib/dk`, with package outputs in `packages/core`.
