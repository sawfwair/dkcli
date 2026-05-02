# Proof-Driven Design

Proof-driven design means decisions remain aesthetic, but they leave evidence behind.

## The Loop

1. Choose a seed and intent.
2. Generate tokens and proof cards.
3. Apply the smallest useful set of variables to the UI.
4. Audit the CSS and interaction burden.
5. Save the proof output next to the component or release artifact.

## A Practical Pass

```bash
dk perfect --seed "#D96F32" --ratio perfect-fourth --motion snappy --json > proof.json
dk palette "#D96F32" --harmony split-complementary > theme.css
dk audit --css theme.css
```

## What Counts As Proof

- APCA contrast passes for real foreground/background pairs.
- Fluid scale values tied to an explicit ratio.
- Interaction targets that acknowledge distance, size, choices, and modality.
- Typography recommendations for measure, line height, spacing, and crowding risk.
- Component verification that can run before publishing.
