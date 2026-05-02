# Motion & Layout

Motion and layout commands help transform visual intent into stable, inspectable CSS.

## Spring Easing

```bash
dk ease --preset snappy
```

The docs theme stores the generated curve in `--dk-motion-curve` and uses it for page-load reveal motion.

## Minimum Jerk

```bash
dk jerk --duration 0.6 --samples 32
```

Minimum-jerk timing is useful when you want calm, human-feeling transitions without cartoon bounce.

## Stack Layout

```bash
dk layout --container 960 --gap 24
```

For richer documents, prefer JSON input files rather than shell-escaped inline objects.

```bash
dk layout --input app-shell.json --importance auto --json
```

## Composition

```bash
dk compose --frame 1440x900 --rects rects.json --json
```

Composition scoring gives you balance, symmetry, alignment, rhythm, density, and order signals.
