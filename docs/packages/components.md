# @dkcli/components

`@dkcli/components` is the framework-facing layer for reusable UI primitives.

## Responsibilities

- Thin Svelte 5 component APIs and rendering.
- Accessible behavior primitives and slot wiring.
- Consumption of compiled tokens instead of recomputing the full DK engine during render.
- Test fixtures and proof cases for each public component.

## Verify Components

```bash
pnpm dk components verify --all
pnpm check:components:strict
```

## Current Component Families

The package includes primitives such as buttons, text fields, selects, menus, badges, avatars, tables, date pickers, steppers, toasts, command palettes, and tree views.
