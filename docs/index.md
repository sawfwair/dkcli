---
layout: home
hero:
  name: DesignKit CLI
  text: Design tokens with the math shown.
  tagline: Run one command. Keep the proof.
  actions:
    - theme: brand
      text: Start Building
      link: /getting-started
---

<ProofTable />

## What DesignKit Does

DesignKit turns design-system decisions into inspectable artifacts: palettes, APCA contrast checks, fluid scales, typography recommendations, motion curves, layout rails, CSS audits, token output, and component proof cases.

It is not a screenshot linter and not a moodboard generator. It is a command line workbench for keeping visual decisions repeatable.

## Start Here

```bash
pnpm install
pnpm dk perfect --seed "#D96F32" --ratio perfect-fourth --motion snappy
```

Then use the result as your evidence trail: copy the CSS, inspect the JSON, or wire the tokens into a package.

## Next Steps

- [Learn the CLI command map](/cli/)
- [Build a theme from generated tokens](/guides/build-a-theme)
- [Understand the package split](/packages/)
- [Inspect the generated proof artifacts](/reference/generated-proof)
