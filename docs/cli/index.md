# CLI command reference

Use this reference to choose a DesignKit command for your task. Commands emit text, CSS, Tailwind fragments, or JSON where supported.

The examples use `dk`. From the source repository, use `pnpm dk` to run the checkout's implementation.

## Commands

The CLI includes the following command groups:

| Command | Purpose |
| --- | --- |
| `perfect` | Combined palette, scale, contrast, motion, layout, and analysis results |
| `palette` | OKLCH tonal scales, semantic tokens, and color harmonies |
| `distinct` | Perceptual distinctness and color-vision-deficiency checks |
| `contrast` | APCA readability checks for foreground and background pairs |
| `scale` | Modular, Fibonacci, and fluid spacing and type scales |
| `text` | Typography spacing and measure recommendations |
| `typeset` | Paragraph shaping, balancing, and hyphenation |
| `linebreak` | Balanced and greedy line-breaking comparisons |
| `ease` | Spring-based CSS `linear()` easing curves |
| `jerk` | Minimum-jerk timing curves |
| `layout` | Layout constraints and coordinates |
| `compose` | Balance, symmetry, alignment, rhythm, and density scores |
| `audit` | CSS analysis using DesignKit heuristics |
| `target` | Fitts, Hick-Hyman, and steering estimates |
| `saliency` | Importance scores from a `DesignDocument` |
| `future` | Experimental content topology and layout CSS |
| `components` | Component fixture verification |
| `cms` | Hosted DKCMS sites, pages, builds, and email exports |

## Output formats

For automation, use `--json`. For CSS or Tailwind output, select the format supported by the command:

```bash
dk palette "#3b82f6" --json
dk scale --ratio golden --tailwind
dk perfect --seed "#295dff" --format=css
dk audit --css app.css --format=text
```

## Command help

To inspect a command's options in the source checkout, run:

```bash
pnpm dk COMMAND --help
```

Replace *`COMMAND`* with a command name, such as `palette`.
