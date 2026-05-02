# Ship Components

Components should ship with behavior, tokens, and proof fixtures.

## Component Checklist

- Public props are typed and documented.
- Accessibility behavior is covered by tests.
- Recipe output is stable and proofable.
- Visual density, target size, and contrast are checked.
- The package can be packed and consumed by the starter app.

## Verification Commands

```bash
pnpm check:components:strict
pnpm dk components verify --all
pnpm build:components
pnpm example:verify
```

## Recipe Pattern

Keep component rendering thin. Let recipes describe intent and proof inputs, let tokens carry compiled values, and let tests catch drift.
