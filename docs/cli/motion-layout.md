# Motion and layout

Use these commands to generate motion curves, solve layout constraints, and inspect composition scores.

## Generate spring easing

To generate the `snappy` preset, run:

```bash
dk ease --preset snappy
```

The documentation theme stores the curve in `--dk-motion-curve` for reveal animations.

## Generate minimum-jerk easing

To generate a 0.6-second curve with 32 samples, run:

```bash
dk jerk --duration 0.6 --samples 32
```

Minimum-jerk timing provides a smooth curve without spring oscillation.

## Solve a stack layout

To solve a layout with a 960-pixel container and a 24-pixel gap, run:

```bash
dk layout --container 960 --gap 24
```

For a structured document, use a JSON file instead of an inline shell argument:

```bash
dk layout --input app-shell.json --importance auto --json
```

## Score a composition

To score the rectangles in the `rects.json` file, run:

```bash
dk compose --frame 1440x900 --rects rects.json --json
```

The result includes balance, symmetry, alignment, rhythm, density, and order scores.
