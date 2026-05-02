# DK Design System Blueprint

This document defines the first durable package split for a full DesignKit-native design system:

- `@dkcli/core`: deterministic math, schema, proofs, and compilation contracts
- `@dkcli/tokens`: theme compilation and token emission
- `@dkcli/components`: framework-facing component layer

The private `../dkweb` SvelteKit app remains the proving ground. The public `packages/` layer gives us a clean path to turn the DK engine into a reusable system without forcing a big-bang migration.

## Goals

- Keep DK math authoritative and framework-agnostic.
- Compile themes once instead of recomputing heavy math inside component renders.
- Make every component proofable through contrast, target, spacing, layout, motion, and distinctness checks.
- Separate authoring contracts from proof inputs so components stay ergonomic while proofs stay deterministic.

## Package Boundaries

### `@dkcli/core`

Responsibilities:

- Color, palette, perceptual distinctness, APCA, and gamut logic
- Modular and fluid scales
- Motion, optical correction, target analysis, layout, composition, typography, line breaking
- Design-system schema and recipe contracts
- Proof runners and audit helpers

Initial migration targets from the current app:

- `src/lib/dk/color.ts`
- `src/lib/dk/palette.ts`
- `src/lib/dk/perception.ts`
- `src/lib/dk/scale.ts`
- `src/lib/dk/layout.ts`
- `src/lib/dk/compose.ts`
- `src/lib/dk/interaction.ts`
- `src/lib/dk/optical.ts`
- `src/lib/dk/ease.ts`
- `src/lib/dk/jerk.ts`
- `src/lib/dk/typography.ts`
- `src/lib/dk/linebreak.ts`
- `src/lib/dk/typeset.ts`
- `src/lib/dk/audit.ts`
- `src/lib/dk/design.ts`
- `src/lib/dk/perfect.ts`

Rules:

- No DOM access
- No network access
- Deterministic output for the same input
- Public APIs typed explicitly

### `@dkcli/tokens`

Responsibilities:

- Turn a `ThemeSeed` into a normalized theme contract
- Emit CSS custom properties, JSON token bundles, and adapter outputs
- Own semantic aliasing and token family naming
- Cache compiled token artifacts for component consumption

Key rule:

- `@dkcli/tokens` depends on `@dkcli/core`, never the other way around.

### `@dkcli/components`

Responsibilities:

- Thin framework layer for component APIs and rendering
- Accessible behavior primitives and slot wiring
- Consume compiled token artifacts rather than running the full DK engine during render
- Expose test fixtures and proof cases for each public component

Initial framework target:

- Svelte first, with the architecture kept renderer-neutral enough to add other adapters later

Key rule:

- Production component rendering should rely on precompiled recipes and token bundles. Heavy proof math stays in build, docs, and test workflows.

## Dependency Rules

- `@dkcli/core` -> no UI package dependencies
- `@dkcli/tokens` -> `@dkcli/core`
- `@dkcli/components` -> `@dkcli/tokens`
- Docs app and proof tooling may depend on all three
- `@dkcli/components` may import `@dkcli/core` in dev and test utilities, but public rendering paths should avoid it

## Build Pipeline

1. `ThemeSeed` enters `@dkcli/tokens`
2. `@dkcli/tokens` asks `@dkcli/core` for palette, scale, motion, and proof-derived values
3. `@dkcli/tokens` emits a `ThemeContract`
4. `ComponentSpec + ThemeContract` compiles into concrete recipes
5. Recipes emit CSS variables, slot styles, and proof fixtures
6. Proof fixtures compile into deterministic `DesignDocument`-style checks
7. CI runs contrast, target, distinctness, layout, motion, and audit gates

## First 10 Components

The first public components should maximize reuse of behavior, proof infrastructure, and token families.

1. `Button`
2. `TextField`
3. `Textarea`
4. `Checkbox`
5. `Switch`
6. `RadioGroup`
7. `Select`
8. `Dialog`
9. `Tabs`
10. `Popover`

Why this order:

- `Button` establishes action semantics, APCA gates, and size variants
- `TextField`, `Textarea`, `Checkbox`, `Switch`, and `RadioGroup` create a reusable form shell
- `Select`, `Dialog`, `Tabs`, and `Popover` force overlay, focus, keyboard, and layering primitives into the open

## Internal Primitives

These are not public roadmap slots, but should exist before or during the first ten:

- `Box`
- `Stack`
- `Text`
- `Icon`
- `Surface`
- `FieldFrame`
- `Portal`
- `FocusScope`

## Component Schema

`@dkcli/core` owns the authoring schema. Components should be authored as high-level specs and compiled into proofable cases.

```ts
type ThemeSeed = {
  color: `#${string}`;
  ratio: string | number;
  mode: 'light' | 'dark';
  density: 'comfortable' | 'compact';
  motion: string;
  contrastProfile?: 'default' | 'low-vision';
};

type TokenExpr =
  | { ref: string }
  | { scale: 'space' | 'type' | 'radius' | 'elevation'; step: string }
  | { alias: string }
  | { onColor: TokenExpr }
  | { mul: [TokenExpr, number] }
  | { literal: string | number };

type SlotSpec = {
  name: string;
  kind: 'container' | 'text' | 'icon' | 'control';
  role?: 'title' | 'body' | 'cta' | 'support' | 'meta';
  required?: boolean;
};

type ComponentSpec = {
  id: string;
  slots: SlotSpec[];
  axes: Array<{ name: string; values: string[]; default: string }>;
  states: Array<
    | 'rest'
    | 'hover'
    | 'focus-visible'
    | 'pressed'
    | 'disabled'
    | 'invalid'
    | 'loading'
    | 'open'
    | 'selected'
  >;
  recipe: Record<
    string,
    Array<{
      match?: {
        axes?: Record<string, string>;
        states?: Record<string, boolean>;
      };
      style: Record<string, TokenExpr>;
    }>
  >;
  proofs: {
    contrast?: Array<{
      target: string;
      foreground: TokenExpr;
      background: TokenExpr;
      fontSize: TokenExpr | number;
      fontWeight: number;
      minLc?: number;
    }>;
    target?: Array<{
      target: string;
      minSize: TokenExpr | number;
      modality: 'mouse' | 'touch';
    }>;
    distinctness?: Array<{
      tokens: string[];
      minDeltaE: number;
      cvd: boolean;
    }>;
    layout?: {
      widths: number[];
      heights?: number[];
      noOverflow: boolean;
    };
    motion?: Array<{
      target: string;
      durationMaxMs: number;
    }>;
  };
  a11y: {
    role: string;
    keyboardModel?: string;
    labelling?: 'slot-label' | 'aria-label' | 'external-label';
  };
};
```

## Proof Expectations Per Component

Every public component should eventually emit:

- a default proof case
- at least one stress case
- touch-target verification
- APCA checks for each meaningful foreground/background pair
- responsive layout checks at small, medium, and large widths
- token drift audit against DK scale ladders

## Migration Plan

### Phase 1

- Land `packages/core`, `packages/tokens`, and `packages/components`
- Add schema, theme contract, and placeholder exports
- Keep the current app working unchanged

### Phase 2

- Move the existing pure math modules from `src/lib/dk` into `@dkcli/core`
- Re-export from the app during transition
- Keep route behavior stable while imports migrate

### Phase 3

- Compile `tokens.css` from `@dkcli/tokens`
- Introduce component recipes driven by `ComponentSpec`
- Build docs and proofs for the first 3 to 5 public components

### Phase 4

- Expand to the first 10 public components
- Add CI proof gates and docs publishing
- Decide whether to publish packages publicly or keep them workspace-private longer
