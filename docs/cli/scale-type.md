# Scale & Type

DesignKit treats spacing, type size, measure, and line flow as connected systems.

## Fluid Scale

```bash
dk scale --fluid --ratio perfect-fourth --base-min 15 --base-max 19
```

The docs theme imports the generated variables from `docs/.vitepress/theme/generated/dk-tokens.css`:

```css
.component {
  padding: var(--space-sm);
  gap: var(--space-xs);
  margin-block: var(--space-xl);
}
```

## Text Recommendations

```bash
dk text --font 18 --measure 680 --contrast 72 --profile default
```

The command recommends line height, word spacing, paragraph spacing, crowding risk, and advanced typesetting data.

## Balance Lines

```bash
dk linebreak --text "Mathematical interfaces deserve intentional line breaks." --chars 24 --lines 3
```

Use this for headlines, marketing copy, command descriptions, and docs hero text where ragged lines are visible.
