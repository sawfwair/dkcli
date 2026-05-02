# `src/lib/dk`

This directory holds the pure logic behind the DesignKit CLI commands. Functions here should stay deterministic and side-effect free, except where the return value is intentionally a generated CSS/string artifact.

Private website and runtime integrations live outside this public package repo in the sibling `../dkweb` workspace.

## Modules

- `color.ts`: color conversion, gamut clipping, WCAG/APCA contrast helpers
- `compose.ts`: composition scoring for balance, symmetry, alignment, rhythm, and density
- `design.ts`: shared `DesignDocument` / advanced layout-composition schema
- `layout.ts`: min / preferred / max layout solving for constraint-style stacks
- `palette.ts`: tonal scales, neutral scales, semantic tokens, color harmony
- `perception.ts`: CIEDE2000 color distance, color-vision deficiency simulation, palette distinctness
- `scale.ts`: modular, fibonacci, and fluid spacing/type scales
- `glass.ts`: glassmorphism CSS generation helpers
- `interaction.ts`: Fitts, Hick-Hyman, and steering-law interaction cost helpers
- `optical.ts`: optical correction presets and lookup API
- `ease.ts`: spring physics and bezier-to-linear conversion
- `jerk.ts`: minimum-jerk motion sampling and CSS export
- `linebreak.ts`: balanced line breaking via dynamic programming
- `typography.ts`: spacing and line-measure recommendations for readable text
- `audit.ts`: CSS extraction, scoring, and formatter output
- `saliency.ts`: deterministic importance scoring for `DesignDocument` inputs
- `typeset.ts`: prepared paragraph shaping, width-aware relayout, and streaming line flow
- `future.ts`: embedding-topology experiments for semantic clustering, slot planning, and layout priors
- `future-text.ts`: experimental semantic paragraph setting layered on top of the prepared typesetter
- `index.ts`: consumer-facing barrel export

## Rules

- No DOM access or network access here.
- Keep public functions typed explicitly.
- Add or update a matching `*.test.ts` file when behavior changes.
- If a module grows materially beyond its current responsibility, split it instead of turning it into a kitchen-sink utility.
