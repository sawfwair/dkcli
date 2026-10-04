# Token package

For theme authors, `@dkcli/tokens` compiles design inputs into a theme contract, CSS custom properties, and JSON.

It depends on `@dkcli/core`. The core package does not depend on the token package.

## Create and export a theme

The following example creates a theme and exports both formats:

```ts
import { createTheme, emitThemeCss, emitThemeJson } from '@dkcli/tokens'

const theme = createTheme({
  name: 'Terracotta',
  seed: {
    color: '#D96F32',
    mode: 'light',
    density: 'comfortable',
    ratio: 'perfect-fourth',
    motion: 'snappy'
  }
})
const css = emitThemeCss(theme)
const json = emitThemeJson(theme)
```

Pass `theme` to components. For server rendering, include the emitted CSS in the initial response.

JSON contains the full theme contract, including `name` and `seed`. An app can validate those inputs and regenerate the theme. The format is a DesignKit contract, not Design Tokens Community Group (DTCG) interchange.

## Consumer example

The `examples/sveltekit-starter` app demonstrates server-rendered theme CSS, cookie preferences, and workbench JSON import.

Motion presets share duration values. The example keeps motion fixed and exposes color, mode, density, and ratio inputs that change tokens.
