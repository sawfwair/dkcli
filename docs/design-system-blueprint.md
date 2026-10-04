# Archived design-system blueprint

For package contributors, this archived proposal records the original package split, schema sketch, and migration sequence.

The proposed packages were `@dkcli/core` for calculations and compilation, `@dkcli/tokens` for themes and exports, and `@dkcli/components` for framework components.

For implemented package responsibilities, see [Package overview](/packages/). The sibling `dkweb` workbench consumes the public package artifacts.

## Original goals

The proposal defined four goals:

- Keep DesignKit calculations authoritative and independent of a UI framework.
- Compile themes before rendering components.
- Check every component for contrast, target size, spacing, layout, motion, and distinctness.
- Separate component authoring contracts from inputs to deterministic mathematical checks.

## Package boundaries

### Core package

The proposed responsibilities were:

- Color, palette, perceptual distinctness, APCA, and gamut logic
- Modular and fluid scales
- Motion, optical correction, target analysis, layout, composition, typography, line breaking
- Design-system schema and recipe contracts
- Proof runners and audit helpers

The original migration targeted these app files:

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

The proposal defined these requirements:

- Exclude DOM access.
- Exclude network access.
- Produce deterministic output for the same input.
- Type public APIs explicitly.

### Token package

The proposed responsibilities were:

- Turn a `ThemeSeed` into a normalized theme contract.
- Emit CSS custom properties, JSON token bundles, and adapter outputs.
- Define semantic aliases and token family names.
- Cache compiled tokens for components.

The token package depended on the core package. The core package did not depend on the token package.

### Component package

The proposed responsibilities were:

- Provide a framework layer for component APIs and rendering.
- Provide accessible behavior primitives and slot wiring.
- Consume compiled tokens instead of recalculating themes during rendering.
- Expose test fixtures and mathematical cases for each public component.

Svelte was the initial framework target. The proposal reserved renderer-neutral boundaries.

The proposal placed heavy mathematical checks in build, documentation, and test workflows. Production rendering was intended to use compiled recipes and token bundles.

## Dependency rules

The proposal defined these dependency rules:

- `@dkcli/core` -> no UI package dependencies
- `@dkcli/tokens` -> `@dkcli/core`
- `@dkcli/components` -> `@dkcli/tokens`
- Documentation and mathematical tooling could depend on all three packages.
- The proposal limited direct core imports in components to development and test utilities.

## Proposed build pipeline

1. `ThemeSeed` enters `@dkcli/tokens`.
2. `@dkcli/tokens` uses `@dkcli/core` to calculate palette, scale, motion, and mathematical values.
3. `@dkcli/tokens` emits a `ThemeContract`.
4. The compiler combines `ComponentSpec` and `ThemeContract` to produce recipes.
5. Recipes emit CSS variables, slot styles, and proof fixtures.
6. Proof fixtures compile into deterministic checks based on `DesignDocument`.
7. CI runs contrast, target, distinctness, layout, motion, and audit checks.

## Initial component sequence

The original order prioritized shared behavior, mathematical infrastructure, and token families in this sequence:

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

The order reflected these dependencies:

- `Button` establishes action semantics, APCA checks, and size variants.
- `TextField`, `Textarea`, `Checkbox`, `Switch`, and `RadioGroup` establish shared form behavior.
- `Select`, `Dialog`, `Tabs`, and `Popover` exercise overlay, focus, keyboard, and layering primitives.

## Proposed internal primitives

The proposal paired the initial components with these internal primitives:

- `Box`
- `Stack`
- `Text`
- `Icon`
- `Surface`
- `FieldFrame`
- `Portal`
- `FocusScope`

## Schema sketch

The proposal assigned the authoring schema to `@dkcli/core`. It compiled component specifications into cases with mathematical checks.

The following types record the original schema sketch. For implemented declarations, inspect the installed package types:

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

## Proposed evidence per component

The proposal required the following evidence for each public component:

- A default mathematical case
- At least one stress case
- Touch-target verification
- APCA checks for each meaningful foreground and background pair
- Layout checks at small, medium, and large widths
- A token audit against the design scales

## Original migration sequence

### Package scaffolding

- Create `packages/core`, `packages/tokens`, and `packages/components`.
- Add the schema, theme contract, and placeholder exports.
- Preserve app behavior.

### Calculation modules

- Move pure calculations from `src/lib/dk` into `@dkcli/core`.
- Re-export from the app during the transition.
- Preserve route behavior during import migration.

### Tokens and recipes

- Compile `tokens.css` from `@dkcli/tokens`.
- Introduce component recipes driven by `ComponentSpec`.
- Build documentation and mathematical fixtures for the first three to five public components.

### Component expansion

- Expand to the first 10 public components.
- Add CI mathematical checks and documentation publishing.
- Review public publication or workspace-only distribution.
