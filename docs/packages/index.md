# Package overview

For app and library developers, DesignKit separates reusable calculations, theme compilation, Svelte components, and CLI commands.

## Package dependencies

The reusable packages have the following DesignKit dependencies:

| Package | Other DesignKit packages required at runtime |
| --- | --- |
| `@dkcli/core` | None |
| `@dkcli/tokens` | `@dkcli/core` |
| `@dkcli/components` | `@dkcli/core` and `@dkcli/tokens` |
| `@dkcli/cli` | None; the build bundles its implementation |

## Package responsibilities

Choose the package that matches your integration:

- [`@dkcli/core`](/packages/core): deterministic calculations, recipe compilation, and audit helpers
- [`@dkcli/tokens`](/packages/tokens): theme compilation, semantic aliases, CSS, and JSON
- [`@dkcli/components`](/packages/components): Svelte component APIs, behavior helpers, and recipes
- `@dkcli/cli`: commands for generating and inspecting design artifacts

The package split lets you test mathematical results without a browser and pass shared theme values to components.
