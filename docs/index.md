---
layout: home
hero:
  name: DesignKit CLI
  text: Generate design tokens and mathematical evidence.
  tagline: CLI and package documentation for this source checkout.
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
---

<ProofTable />

## Design artifacts

DesignKit generates palettes, contrast checks, fluid scales, typography recommendations, motion curves, layout constraints, CSS audits, tokens, and component fixtures.

Use the CLI to inspect the calculations behind your design inputs. Mathematical results do not establish browser behavior or accessibility compliance.

## Generate an artifact

From the repository root, install dependencies and generate a combined result:

```bash
pnpm install --frozen-lockfile
pnpm dk perfect --seed "#D96F32" --ratio perfect-fourth --motion snappy
```

Save the CSS or JSON output with the component or release that uses it.

## Guides and reference

- [CLI command reference](/cli/)
- [Build a theme](/guides/build-a-theme)
- [Package responsibilities](/packages/)
- [Generated documentation artifacts](/reference/generated-proof)
