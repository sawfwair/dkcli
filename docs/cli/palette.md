# Palette

`dk palette` generates OKLCH tonal scales, semantic tokens, and harmony sets from a seed color.

## Generate A Split Complement

```bash
dk palette "#D96F32" --harmony split-complementary
```

<div class="dk-swatch-row">
  <div class="dk-swatch" style="background: var(--dk-tone-primary-100)"></div>
  <div class="dk-swatch" style="background: var(--dk-tone-primary-200)"></div>
  <div class="dk-swatch" style="background: var(--dk-seed)"></div>
  <div class="dk-swatch" style="background: var(--dk-accent-a)"></div>
  <div class="dk-swatch" style="background: var(--dk-accent-b)"></div>
  <div class="dk-swatch" style="background: var(--dk-ink)"></div>
</div>

## JSON For Tooling

```bash
dk palette "#D96F32" --harmony split-complementary --json
```

Use the JSON output to feed token pipelines, documentation examples, contrast tests, or visual regression fixtures.

## Stress Test Distinctness

```bash
dk distinct --colors "#D96F32,#00A8AD,#5190EC" --threshold 10 --json
```

This is useful before assigning colors to charts, statuses, or segmented controls.
