# Scale and typography

Use these commands to generate spacing and type scales, estimate readable measure, and balance lines.

## Generate a fluid scale

To interpolate between 15-pixel and 19-pixel base sizes, run:

```bash
dk scale --fluid --ratio perfect-fourth --base-min 15 --base-max 19
```

The documentation theme imports the generated variables from the `docs/.vitepress/theme/generated/dk-tokens.css` file. To apply spacing variables, use:

```css
.component {
  padding: var(--space-sm);
  gap: var(--space-xs);
  margin-block: var(--space-xl);
}
```

## Estimate text spacing

To generate recommendations for an 18-pixel font and a 680-pixel measure, run:

```bash
dk text --font 18 --measure 680 --contrast 72 --profile default
```

The result includes line height, word spacing, paragraph spacing, crowding risk, and typesetting data.

## Balance lines

To compare line breaks for a heading, run:

```bash
dk linebreak --text "Theme colors and spacing follow a scale." \
    --chars 24 --lines 3
```

Line-breaking results use text and width estimates. Inspect the rendered text with the font used by your app.
