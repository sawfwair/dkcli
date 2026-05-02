<script lang="ts">
  import type { ThemeContract } from '@dkcli/core';

  import Button from './Button.svelte';
  import type { ButtonVariant } from './button.spec.js';

  export let theme: ThemeContract;
  export let variant: ButtonVariant = 'solid';
  export let href: string | undefined = undefined;
  export let as: 'button' | 'a' | undefined = undefined;
  export let iconOnly = false;
  export let loading = false;
  export let ariaLabel = 'Icon action';
  export let showLeading = false;
  export let showTrailing = false;
  export let showIcon = false;
  export let showSpinner = false;
</script>

<Button {theme} {variant} {href} {as} {iconOnly} {loading} ariaLabel={iconOnly ? ariaLabel : undefined}>
  <svelte:fragment slot="leading">
    {#if showLeading}
      <span data-testid="leading-slot">!</span>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="trailing">
    {#if showTrailing}
      <span data-testid="trailing-slot">&gt;</span>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="icon">
    {#if showIcon}
      <span data-testid="icon-slot">gear</span>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="spinner">
    {#if showSpinner}
      <span data-testid="spinner-slot">spin</span>
    {/if}
  </svelte:fragment>
  {#if !iconOnly}
    Label
  {/if}
</Button>
