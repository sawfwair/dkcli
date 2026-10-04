# `@dkcli/components`

Use `@dkcli/components` to add themed components to a Svelte app and inspect
their compiled recipes and mathematical proof fixtures.

The package requires Svelte 5.20.0 or later in the Svelte 5 release line.

## Install

Install the components and token packages:

```bash
npm install @dkcli/components @dkcli/tokens
```

## Add a component

Import a component into a Svelte file:

```svelte
<script lang="ts">
  import { Button } from '@dkcli/components';
</script>

<Button>Save</Button>
```

Components use a default theme. To supply your theme, create a `ThemeContract`
with `@dkcli/tokens` and pass it through the component's `theme` prop.

Proof fixtures evaluate declared mathematical checks. Layout checks use
conservative single-line estimates and maximum token values. Fixtures do not
collect rendered evidence or establish accessibility compliance.

For component APIs and starter setup, see the
[DesignKit component documentation](https://dkcli.com/components).
