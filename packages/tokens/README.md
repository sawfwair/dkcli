# `@dkcli/tokens`

Use `@dkcli/tokens` to create a `ThemeContract` and export its CSS variables or
JSON representation.

## Install

Install the package:

```bash
npm install @dkcli/tokens
```

## Create a theme

Create a theme from a seed color, scale ratio, mode, density, and motion preset:

```ts
import { createTheme, emitThemeCss } from '@dkcli/tokens';

const theme = createTheme({
  name: 'app',
  seed: {
    color: '#295dff',
    ratio: 'perfect-fourth',
    mode: 'light',
    density: 'comfortable',
    motion: 'snappy'
  }
});

const css = emitThemeCss(theme);
```

Pass the theme to `@dkcli/components` or include the generated CSS in your app.
`emitThemeJson` serializes the DesignKit `ThemeContract`; it does not export the
Design Tokens Community Group format.

## Compile an authored project

Use `createProjectTheme(project.theme)` for a project created with
`createThemeProject` from `@dkcli/core`. It compiles the seed, body/display/mono
font stacks, supported semantic token overrides, and motion preset into the same
`ThemeContract` accepted by components and emitters.

Invalid overrides throw before replacing an existing artifact. Opaque colors and
supported CSS lengths keep mathematical fixtures interpretable; browser receipts
record the actual rendered sizes separately.

For lower-level math, use [`@dkcli/core`](https://www.npmjs.com/package/@dkcli/core).
