# Audits and mathematical evidence

Use these commands to inspect source CSS, generated design results, and interaction-target estimates.

## Audit source CSS

To audit the `app.css` file, run:

```bash
dk audit --css app.css
```

To read CSS from standard input and emit JSON, run:

```bash
dk audit --stdin --json < app.css
```

Source CSS audits apply heuristics with assumptions about inheritance, units, and backgrounds. They do not collect rendered browser behavior.

## Generate a combined result

To generate palette, contrast, scale, layout, typography, motion, and interaction estimates, run:

```bash
dk perfect --seed "#D96F32" --ratio perfect-fourth \
    --motion snappy --mode light --json
```

For strict exit codes and evidence limits, see [Design with mathematical evidence](/guides/proof-driven-design).

## Estimate interaction targets

To estimate a touch interaction from distance, target width, and choice count, run:

```bash
dk target --distance 280 --width 44 --choices 6 --modality touch --json
```

Use the estimate when comparing navigation controls, toolbars, or menus. Validate the rendered controls separately.
