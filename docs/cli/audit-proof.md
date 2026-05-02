# Audit & Proofs

DesignKit helps you ask better design questions before a reviewer has to squint at a screenshot.

## CSS Audit

```bash
dk audit --css app.css
cat app.css | dk audit --stdin --json
```

Source CSS audits score heuristics that are cheap to run in CI and useful during component review.

## Perfect Proof

```bash
dk perfect --seed "#D96F32" --ratio perfect-fourth --motion snappy --mode light --json
```

The generated proof includes tokens, APCA proof cards, fluid scale data, layout rails, composition results, typography recommendations, target estimates, and line breaking output.

## Interaction Targets

```bash
dk target --distance 280 --width 44 --choices 6 --modality touch --json
```

Use target estimates for touch-heavy navigation, dense toolbars, menus, and high-frequency actions.
