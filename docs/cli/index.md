# CLI Command Map

`dk` is a command line design workbench. Each command solves a narrow design-system problem and can emit human-readable text, CSS, Tailwind fragments, or JSON where supported.

## Core Commands

| Command | Use it for |
| --- | --- |
| `perfect` | One combined proof state across palette, scale, contrast, motion, layout, and analysis. |
| `palette` | OKLCH tonal scales, semantic tokens, and harmony generation. |
| `distinct` | Perceptual distinctness and color-vision-deficiency collision checks. |
| `contrast` | APCA readability checks for foreground/background pairs. |
| `scale` | Modular, fibonacci, and fluid spacing/type scales. |
| `text` | Typography spacing and readable measure recommendations. |
| `typeset` | Width-aware paragraph shaping, balancing, and hyphenation. |
| `linebreak` | Balanced versus greedy line break comparisons. |
| `ease` | Spring physics to CSS `linear()` easing curves. |
| `jerk` | Minimum-jerk timing curves. |
| `layout` | Stable rails for stack layout constraints. |
| `compose` | Balance, symmetry, alignment, rhythm, and density scoring. |
| `audit` | CSS scoring against DesignKit heuristics. |
| `target` | Fitts, Hick-Hyman, and steering interaction-burden estimates. |
| `saliency` | Visual importance scoring from a `DesignDocument`. |
| `future` | Experimental content topology and layout CSS generation. |
| `components` | Shipped component proof verification. |
| `cms` | Hosted DKCMS sites, pages, builds, and email exports. |

## Output Modes

```bash
dk palette "#3b82f6" --json
dk scale --ratio golden --tailwind
dk perfect --seed "#295dff" --format=css
dk audit --css app.css --format=text
```

Prefer `--json` for automation and default text/CSS output for copy-ready snippets.

## Source Development

```bash
pnpm dk --help
pnpm dk <command> --help
```
