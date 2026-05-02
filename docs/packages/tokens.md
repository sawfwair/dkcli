# @dkcli/tokens

`@dkcli/tokens` turns design seeds and recipe outputs into artifacts apps can consume.

## Responsibilities

- Turn a `ThemeSeed` into a normalized theme contract.
- Emit CSS custom properties and JSON token bundles.
- Own semantic aliasing and token family naming.
- Cache compiled token artifacts for component consumption.

## Dependency Rule

`@dkcli/tokens` depends on `@dkcli/core`, never the other way around.

## Example Shape

```ts
import { createTheme, emitCssVariables } from '@dkcli/tokens'

const theme = createTheme({ seed: '#D96F32', mode: 'light' })
const css = emitCssVariables(theme)
```
