# Palette

For token authors, `dk palette` generates OKLCH tonal scales, semantic tokens, and harmony sets from a seed color.

## Generate a split-complementary palette

To generate a palette from `#D96F32`, run:

```bash
dk palette "#D96F32" --harmony split-complementary
```

The swatches illustrate primary tones, the seed, harmony accents, and the text color:

<div class="dk-swatch-row" role="img" aria-label="Primary tones 100 and 200, the seed color, two harmony accents, and the text color.">
  <div class="dk-swatch" style="background: var(--dk-tone-primary-100)"></div>
  <div class="dk-swatch" style="background: var(--dk-tone-primary-200)"></div>
  <div class="dk-swatch" style="background: var(--dk-seed)"></div>
  <div class="dk-swatch" style="background: var(--dk-accent-a)"></div>
  <div class="dk-swatch" style="background: var(--dk-accent-b)"></div>
  <div class="dk-swatch" style="background: var(--dk-ink)"></div>
</div>

## Emit JSON

To use the palette in a token pipeline or test fixture, emit JSON:

```bash
dk palette "#D96F32" --harmony split-complementary --json
```

## Check distinctness

Before assigning colors to charts or statuses, inspect their perceptual separation:

```bash
dk distinct --colors "#D96F32,#00A8AD,#5190EC" --threshold 10 --json
```
