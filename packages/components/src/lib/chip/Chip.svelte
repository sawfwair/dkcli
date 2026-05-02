<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import {
    DEFAULT_CHIP_THEME,
    createChipRegistration,
    getChipRecipeCase,
    serializeChipSlotStyles
  } from './chip.recipe.js';
  import type { ChipSize, ChipTone } from './chip.spec.js';

  const dispatch = createEventDispatcher<{ change: { selected: boolean }; dismiss: void }>();

  export let label = 'Chip';
  export let tone: ChipTone = 'neutral';
  export let size: ChipSize = 'md';
  export let selected = false;
  export let dismissible = false;
  export let disabled = false;
  export let theme: ThemeContract = DEFAULT_CHIP_THEME;
  export let onChange: ((detail: { selected: boolean }) => void) | undefined = undefined;
  export let onDismiss: (() => void) | undefined = undefined;

  const defaultRegistration = createChipRegistration(DEFAULT_CHIP_THEME);

  let registration = defaultRegistration;
  let internalSelected = selected;
  let previousSelected = selected;
  let compiledCase = getChipRecipeCase(defaultRegistration.recipe, { tone, size });
  let slotStyles = serializeChipSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_CHIP_THEME.name ? defaultRegistration : createChipRegistration(theme);
  $: if (selected !== previousSelected) {
    internalSelected = selected;
    previousSelected = selected;
  }
  $: compiledCase = getChipRecipeCase(registration.recipe, { tone, size });
  $: slotStyles = serializeChipSlotStyles(compiledCase);

  function toggle(): void {
    if (disabled) {
      return;
    }
    internalSelected = !internalSelected;
    selected = internalSelected;
    onChange?.({ selected: internalSelected });
    dispatch('change', { selected: internalSelected });
  }

  function dismiss(): void {
    onDismiss?.();
    dispatch('dismiss');
  }
</script>

<div class="dk-chip" style={slotStyles.root} data-selected={internalSelected}>
  <button
    class="chip-button"
    type="button"
    style={slotStyles.button}
    data-selected={internalSelected}
    {disabled}
    aria-pressed={internalSelected ? 'true' : 'false'}
    onclick={toggle}
  >
    {#if $$slots.leading}
      <span class="chip-leading" style={slotStyles.leading}>
        <slot name="leading" />
      </span>
    {/if}
    <span class="chip-label" style={slotStyles.label}>{label}</span>
  </button>

  {#if dismissible}
    <button
      class="chip-dismiss"
      type="button"
      style={slotStyles.dismiss}
      aria-label={`Dismiss ${label}`}
      onclick={dismiss}
      disabled={disabled}
    >
      ×
    </button>
  {/if}
</div>

<style>
  .dk-chip {
    align-items: center;
    display: inline-flex;
    gap: var(--dk-chip-gap);
  }

  .chip-button {
    align-items: center;
    background: var(--dk-chip-bg);
    border: 1px solid var(--dk-chip-border);
    border-radius: var(--dk-chip-radius);
    color: var(--dk-chip-fg);
    cursor: pointer;
    display: inline-flex;
    gap: var(--dk-chip-gap);
    min-block-size: var(--dk-chip-block-size);
    padding: 0 var(--dk-chip-inline-padding);
  }

  .chip-button[data-selected='true'] {
    background: var(--dk-chip-bg-selected, var(--dk-chip-bg));
    color: var(--dk-chip-fg-selected, var(--dk-chip-fg));
    border-color: var(--dk-chip-border-selected, var(--dk-chip-border));
  }

  .chip-button:disabled,
  .chip-dismiss:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .chip-button:focus-visible,
  .chip-dismiss:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--dk-chip-border) 30%, transparent);
    outline-offset: 2px;
  }

  .chip-leading {
    align-items: center;
    display: inline-flex;
    font-size: var(--dk-chip-leading-size);
    justify-content: center;
  }

  .chip-label {
    font-size: var(--dk-chip-label-size);
    font-weight: var(--dk-chip-label-weight);
  }

  .chip-dismiss {
    align-items: center;
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    font-size: 1rem;
    inline-size: var(--dk-chip-dismiss-size);
    justify-content: center;
    min-block-size: var(--dk-chip-dismiss-size);
    padding: 0;
  }
</style>
