<script lang="ts">
  import type { ThemeContract } from '@dkcli/core';

  import TextField from './TextField.svelte';
  import type { TextFieldSize } from './text-field.spec.js';

  export let theme: ThemeContract;
  export let size: TextFieldSize = 'md';
  export let error: string | undefined = undefined;
  export let disabled = false;
  export let showLeading = false;
  export let showTrailing = false;
  export let onChange: ((detail: { value: string }) => void) | undefined = undefined;
</script>

<TextField
  {theme}
  {size}
  label="Project name"
  description="Use a short name."
  placeholder="Launch roadmap"
  {error}
  {disabled}
  {onChange}
>
  <svelte:fragment slot="leading">
    {#if showLeading}
      <span data-testid="leading-slot">#</span>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="trailing">
    {#if showTrailing}
      <span data-testid="trailing-slot">ok</span>
    {/if}
  </svelte:fragment>
</TextField>
