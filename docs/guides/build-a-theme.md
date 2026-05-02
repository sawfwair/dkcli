# Build A Theme

A DesignKit theme starts with a seed color, but it should not end with one color ramp pasted into CSS.

## Generate Palette And Scale

```bash
dk palette "#D96F32" --harmony split-complementary --json > palette.json
dk scale --fluid --ratio perfect-fourth --base-min 15 --base-max 19 --json > scale.json
```

## Check Readability

```bash
dk contrast "#1e1711" "#fdf3ea" --size 18
dk contrast "#ffffff" "#af6100" --size 16 --weight 700
```

## Apply Tokens

Use semantic names in app code and keep raw tones in the token compiler or generated CSS.

```css
:root {
  --surface: var(--dk-surface);
  --ink: var(--dk-ink);
  --action: var(--dk-primary);
  --space-field: var(--space-xs);
}
```
