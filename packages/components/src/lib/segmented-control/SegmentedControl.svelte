<script context="module" lang="ts">
  export type SegmentedControlItem = {
    value: string;
    label: string;
    disabled?: boolean;
  };
</script>

<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import { moveRovingIndex } from '../internal/behavior/index.js';
  import {
    DEFAULT_SEGMENTED_CONTROL_THEME,
    createSegmentedControlRegistration,
    getSegmentedControlRecipeCase,
    serializeSegmentedControlSlotStyles
  } from './segmented-control.recipe.js';
  import type { SegmentedControlSize } from './segmented-control.spec.js';

  const dispatch = createEventDispatcher<{ change: { value: string } }>();

  export let items: SegmentedControlItem[] = [];
  export let value: string | undefined = undefined;
  export let size: SegmentedControlSize = 'md';
  export let theme: ThemeContract = DEFAULT_SEGMENTED_CONTROL_THEME;
  export let onChange: ((detail: { value: string }) => void) | undefined = undefined;

  const defaultRegistration = createSegmentedControlRegistration(DEFAULT_SEGMENTED_CONTROL_THEME);

  let registration = defaultRegistration;
  let currentValue = value;
  let previousValue = value;
  let focusedIndex = 0;
  let itemRefs: HTMLButtonElement[] = [];
  let compiledCase = getSegmentedControlRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeSegmentedControlSlotStyles(compiledCase);

  $: registration =
    theme.name === DEFAULT_SEGMENTED_CONTROL_THEME.name
      ? defaultRegistration
      : createSegmentedControlRegistration(theme);
  $: if (value !== previousValue) {
    currentValue = value;
    previousValue = value;
  }
  $: currentValue = currentValue ?? items.find((item) => !item.disabled)?.value;
  $: focusedIndex = Math.max(0, items.findIndex((item) => item.value === currentValue));
  $: compiledCase = getSegmentedControlRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeSegmentedControlSlotStyles(compiledCase);

  async function focusItem(index: number): Promise<void> {
    await tick();
    itemRefs[index]?.focus();
  }

  function selectValue(nextValue: string): void {
    if (nextValue === currentValue) {
      return;
    }
    currentValue = nextValue;
    value = nextValue;
    onChange?.({ value: nextValue });
    dispatch('change', { value: nextValue });
  }

  function handleKeydown(event: KeyboardEvent): void {
    const nextIndex = moveRovingIndex(items, focusedIndex, event.key, 'horizontal');
    if (nextIndex === focusedIndex) {
      if (event.key === 'Enter' || event.key === ' ') {
        const nextValue = items[focusedIndex]?.value;
        if (nextValue) {
          selectValue(nextValue);
          event.preventDefault();
        }
      }
      return;
    }

    focusedIndex = nextIndex;
    const nextValue = items[nextIndex]?.value;
    if (nextValue) {
      selectValue(nextValue);
      void focusItem(nextIndex);
      event.preventDefault();
    }
  }
</script>

<div class="dk-segmented" style={slotStyles.root}>
  <div
    class="segmented-group"
    style={slotStyles.group}
    role="radiogroup"
    aria-label="Segmented control"
    tabindex="-1"
    onkeydown={handleKeydown}
  >
    {#each items as item, index (item.value)}
      {@const selected = currentValue === item.value}
      <button
        bind:this={itemRefs[index]}
        class="segmented-item"
        style={slotStyles.item}
        type="button"
        role="radio"
        aria-checked={selected ? 'true' : 'false'}
        data-selected={selected}
        disabled={item.disabled}
        tabindex={selected ? 0 : -1}
        onclick={() => {
          focusedIndex = index;
          selectValue(item.value);
        }}
      >
        <span class="segmented-label" style={slotStyles.label}>{item.label}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .dk-segmented {
    display: grid;
    gap: var(--dk-segmented-gap);
  }

  .segmented-group {
    align-items: stretch;
    background: var(--dk-segmented-group-bg);
    border: 1px solid var(--dk-segmented-group-border);
    border-radius: var(--dk-segmented-group-radius);
    display: inline-flex;
    flex-wrap: wrap;
    gap: var(--dk-segmented-group-gap);
    padding: var(--dk-segmented-group-padding);
  }

  .segmented-item {
    align-items: center;
    background: var(--dk-segmented-item-bg);
    border: 0;
    border-radius: var(--dk-segmented-item-radius);
    color: var(--dk-segmented-item-fg);
    cursor: pointer;
    display: inline-flex;
    justify-content: center;
    min-block-size: var(--dk-segmented-item-block-size);
    padding: 0 var(--dk-segmented-item-inline-padding);
  }

  .segmented-item[data-selected='true'] {
    background: var(--dk-segmented-item-bg-selected, var(--dk-segmented-item-bg));
    color: var(--dk-segmented-item-fg-selected, var(--dk-segmented-item-fg));
  }

  .segmented-item:disabled {
    color: var(--dk-segmented-item-fg-disabled, var(--dk-segmented-item-fg));
    cursor: not-allowed;
  }

  .segmented-item:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--dk-segmented-item-fg-selected, var(--dk-segmented-item-fg)) 35%, transparent);
    outline-offset: 2px;
  }

  .segmented-label {
    font-size: var(--dk-segmented-label-size);
    font-weight: var(--dk-segmented-item-font-weight);
  }
</style>
