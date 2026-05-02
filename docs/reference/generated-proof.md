# Generated Proof

This docs site imports generated design variables from `docs/.vitepress/theme/generated/dk-tokens.css`.

## Generation Command

```bash
pnpm docs:tokens
```

The script calls the local source-owned CLI:

```bash
node ./bin/dk.js perfect --seed "#D96F32" --ratio perfect-fourth --motion snappy --mode light --json
node ./bin/dk.js palette "#D96F32" --harmony split-complementary --json
node ./bin/dk.js scale --fluid --ratio perfect-fourth --base-min 15 --base-max 19 --json
node ./bin/dk.js text --font 18 --measure 680 --contrast 72 --profile default --json
node ./bin/dk.js target --distance 280 --width 44 --choices 6 --modality touch --json
```

## Current Theme Evidence

<div class="dk-proof-grid">
  <div class="dk-proof-card"><strong>#D96F32</strong> seed color</div>
  <div class="dk-proof-card"><strong>#fdf3ea</strong> surface</div>
  <div class="dk-proof-card"><strong>#1e1711</strong> ink</div>
</div>

## Generated Files

- `docs/.vitepress/theme/generated/dk-tokens.css`
- `docs/.vitepress/theme/generated/dk-proof.json`

These files are checked in so GitHub Pages builds are transparent and local diffs show when design math changes.
