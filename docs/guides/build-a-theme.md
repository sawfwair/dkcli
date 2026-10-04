# Build a theme

For theme authors, this guide generates palette and scale inputs, checks contrast, and applies semantic token names.

## Generate palette and scale inputs

To save the palette and fluid scale as JSON files, run:

```bash
dk palette "#D96F32" --harmony split-complementary --json > palette.json
dk scale --fluid --ratio perfect-fourth --base-min 15 \
    --base-max 19 --json > scale.json
```

## Check readability

To check the foreground and background pairs used by text and actions, run:

```bash
dk contrast "#1e1711" "#fdf3ea" --size 18
dk contrast "#ffffff" "#af6100" --size 16 --weight 700
```

APCA checks provide contrast evidence. They do not establish WCAG compliance.

## Apply semantic tokens

Use semantic names in app code. Keep raw tones in generated CSS or the token compiler.

The following CSS maps app names to the generated documentation variables:

```css
:root {
  --surface: var(--dk-surface);
  --ink: var(--dk-ink);
  --action: var(--dk-primary);
  --space-field: var(--space-xs);
}
```

For a component theme and CSS export, use the [token package API](/packages/tokens).

To save editable theme inputs, qualify rendered components, and apply reversible
token patches, use a [theme project](/guides/theme-projects).
