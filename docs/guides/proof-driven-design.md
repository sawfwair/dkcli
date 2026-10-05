# Design with mathematical evidence

For designers and developers, this workflow saves the calculations behind design inputs with the resulting component or release artifact.

## Generate and inspect evidence

1. Choose a seed color and design inputs.
2. Generate tokens and mathematical results.
3. Apply the variables to your UI.
4. Audit the CSS and estimate interaction targets.
5. Save the results with the component or release artifact.

To generate a combined result, save a palette, and audit its CSS, run:

```bash
dk perfect --seed "#D96F32" --ratio perfect-fourth \
    --motion snappy --json > proof.json
dk palette "#D96F32" --harmony split-complementary > theme.css
dk audit --css theme.css
```

## Require a strict verdict

For a CI verdict, add `--strict` to `perfect`, `audit`, `components verify`, or `components matrix`. Generation returns exit code `0` by default.

Strict mode writes the requested artifact. It then returns exit code `1` if a check fails or required proof coverage is unsupported:

```bash
dk perfect --seed "#D96F32" --json --strict > proof.json
dk components verify --all --json --strict > components.json
dk audit --css app.css --json --strict > audit.json
```

Component fixtures evaluate each requested layout width and declared color-distinctness check. Coverage reports declared, evaluated, and unsupported proof kinds. A passing wide layout does not cancel a failing narrow layout.

Layout defaults to a single line. Recipes can declare `textBehavior` as `wrap`, `wrap-anywhere`, or `scroll` when the component supports that behavior. The results retain the full single-line estimate and report the minimum inline space required after padding, icons, and other reserved controls. Wrapped estimates also report line count and height at each width. Explicit `heights` and `maxLines` budgets can still fail; a control with a minimum height and natural block growth can omit those limits. Scrolling checks the text viewport, not full value visibility.

## Interpret the result

Mathematical evidence includes the following results:

- APCA contrast for resolved foreground and background pairs
- Fluid scale values tied to a ratio
- Target estimates based on distance, size, choices, and modality
- Typography recommendations for measure, line height, spacing, and crowding
- Component fixture verdicts and proof coverage

Component fixtures and `perfect` provide mathematical estimates. Neither collects browser behavior.

A source CSS audit uses heuristics with assumptions about inheritance, units, and backgrounds. Strict audit rejects missing contrast evidence, including unresolved variables.

Run rendered audits and browser interaction tests separately. APCA results do not establish WCAG compliance.
