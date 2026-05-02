<script context="module" lang="ts">
  export type StepperItem = {
    id: string;
    label: string;
    description?: string;
    status?: 'complete' | 'current' | 'upcoming' | 'error';
  };
</script>

<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import { moveRovingIndex } from '../internal/behavior/index.js';
  import {
    DEFAULT_STEPPER_THEME,
    createStepperRegistration,
    getStepperRecipeCase,
    serializeStepperSlotStyles
  } from './stepper.recipe.js';
  import type { StepperOrientation, StepperSize } from './stepper.spec.js';

  const dispatch = createEventDispatcher<{ change: { value: string } }>();

  export let items: StepperItem[] = [];
  export let value: string | undefined = undefined;
  export let orientation: StepperOrientation = 'horizontal';
  export let interactive = true;
  export let size: StepperSize = 'md';
  export let theme: ThemeContract = DEFAULT_STEPPER_THEME;
  export let onChange: ((detail: { value: string }) => void) | undefined = undefined;

  const defaultRegistration = createStepperRegistration(DEFAULT_STEPPER_THEME);

  let registration = defaultRegistration;
  let currentValue = value;
  let previousValue = value;
  let focusedIndex = 0;
  let itemRefs: HTMLButtonElement[] = [];
  let compiledCase = getStepperRecipeCase(defaultRegistration.recipe, { size, orientation });
  let slotStyles = serializeStepperSlotStyles(compiledCase);

  $: registration =
    theme.name === DEFAULT_STEPPER_THEME.name ? defaultRegistration : createStepperRegistration(theme);
  $: if (value !== previousValue) {
    currentValue = value;
    previousValue = value;
  }
  $: currentValue = currentValue ?? items.find((item) => item.status === 'current')?.id ?? items[0]?.id;
  $: focusedIndex = Math.max(0, items.findIndex((item) => item.id === currentValue));
  $: compiledCase = getStepperRecipeCase(registration.recipe, { size, orientation });
  $: slotStyles = serializeStepperSlotStyles(compiledCase);

  async function focusItem(index: number): Promise<void> {
    await tick();
    itemRefs[index]?.focus();
  }

  function selectValue(nextValue: string): void {
    if (!interactive || nextValue === currentValue) {
      return;
    }
    currentValue = nextValue;
    value = nextValue;
    onChange?.({ value: nextValue });
    dispatch('change', { value: nextValue });
  }

  function indicatorSymbol(item: StepperItem, selected: boolean): string {
    if (item.status === 'complete') return '✓';
    if (item.status === 'error') return '!';
    return selected ? String(focusedIndex + 1) : String(items.findIndex((entry) => entry.id === item.id) + 1);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!interactive) {
      return;
    }

    const nextIndex = moveRovingIndex(items.map((item) => ({ value: item.id, disabled: false })), focusedIndex, event.key, orientation === 'vertical' ? 'vertical' : 'horizontal');
    if (nextIndex === focusedIndex) {
      if (event.key === 'Enter' || event.key === ' ') {
        const nextValue = items[focusedIndex]?.id;
        if (nextValue) {
          selectValue(nextValue);
          event.preventDefault();
        }
      }
      return;
    }

    focusedIndex = nextIndex;
    const nextValue = items[nextIndex]?.id;
    if (nextValue) {
      selectValue(nextValue);
      void focusItem(nextIndex);
      event.preventDefault();
    }
  }
</script>

<nav class="dk-stepper" style={slotStyles.root} data-orientation={orientation} aria-label="Progress">
  <ol
    class="stepper-track"
    style={slotStyles.track}
    role={interactive ? 'tablist' : 'list'}
    aria-orientation={orientation}
    onkeydown={handleKeydown}
  >
    {#each items as item, index (item.id)}
      {@const selected = currentValue === item.id}
      <li class="stepper-cell">
        <button
          bind:this={itemRefs[index]}
          class="stepper-item"
          style={`${slotStyles.item} ${slotStyles.label} ${slotStyles.description} ${slotStyles.indicator}`}
          type="button"
          role={interactive ? 'tab' : 'button'}
          aria-selected={interactive ? (selected ? 'true' : 'false') : undefined}
          data-selected={selected}
          data-status={item.status ?? (selected ? 'current' : 'upcoming')}
          onclick={() => selectValue(item.id)}
        >
          <span class="stepper-indicator" style={slotStyles.indicator} aria-hidden="true">
            {indicatorSymbol(item, selected)}
          </span>
          <span class="stepper-copy">
            <span class="stepper-label" style={slotStyles.label}>{item.label}</span>
            {#if item.description}
              <span class="stepper-description" style={slotStyles.description}>{item.description}</span>
            {/if}
          </span>
        </button>
      </li>
    {/each}
  </ol>
</nav>

<style>
  .dk-stepper,
  .stepper-track,
  .stepper-copy {
    display: grid;
  }

  .stepper-track {
    gap: var(--dk-stepper-track-gap);
    grid-auto-flow: column;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .dk-stepper[data-orientation='vertical'] .stepper-track {
    grid-auto-flow: row;
  }

  .stepper-item {
    align-items: center;
    background: var(--dk-stepper-item-bg);
    border: 0;
    border-radius: var(--dk-stepper-item-radius);
    color: var(--dk-stepper-item-fg);
    cursor: pointer;
    display: inline-grid;
    gap: 0.75rem;
    grid-template-columns: auto 1fr;
    min-block-size: var(--dk-stepper-item-block-size);
    padding: 0.5rem var(--dk-stepper-item-inline-padding);
    text-align: left;
    width: 100%;
  }

  .stepper-item:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--dk-stepper-item-fg) 28%, transparent);
    outline-offset: 2px;
  }

  .stepper-indicator {
    align-items: center;
    background: var(--dk-stepper-indicator-bg);
    border-radius: 999px;
    color: var(--dk-stepper-indicator-fg);
    display: inline-flex;
    font-size: 0.825rem;
    font-weight: 700;
    inline-size: var(--dk-stepper-indicator-size);
    justify-content: center;
    min-inline-size: var(--dk-stepper-indicator-size);
  }

  .stepper-label {
    font-size: var(--dk-stepper-label-size);
    font-weight: var(--dk-stepper-label-weight);
  }

  .stepper-description {
    color: var(--dk-stepper-description-color);
    font-size: var(--dk-stepper-description-size);
    line-height: 1.4;
  }
</style>
