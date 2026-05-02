<script context="module" lang="ts">
  export type SelectItem = {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  };
</script>

<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import { computeAnchoredPosition, findSelectedItem, firstEnabledIndex, isEventOutside, nextListIndex, type Placement } from '../internal/behavior/index.js';
  import { FieldFrame } from '../primitives/index.js';
  import {
    DEFAULT_SELECT_THEME,
    createSelectRegistration,
    getSelectRecipeCase,
    serializeSelectSlotStyles
  } from './select.recipe.js';
  import type { SelectSize } from './select.spec.js';

  let nextId = 0;

  export let value: string | undefined = undefined;
  export let items: SelectItem[] = [];
  export let label: string | undefined = undefined;
  export let description: string | undefined = undefined;
  export let error: string | undefined = undefined;
  export let placeholder = 'Select an option';
  export let required = false;
  export let disabled = false;
  export let name: string | undefined = undefined;
  export let id: string | undefined = undefined;
  export let size: SelectSize = 'md';
  export let theme: ThemeContract = DEFAULT_SELECT_THEME;
  export let onChange: ((detail: { value: string | undefined }) => void) | undefined = undefined;

  const defaultRegistration = createSelectRegistration(DEFAULT_SELECT_THEME);
  const dispatch = createEventDispatcher<{ change: { value: string | undefined } }>();
  const localId = `dk-select-${++nextId}`;

  let registration = defaultRegistration;
  let internalOpen = false;
  let triggerEl: HTMLButtonElement | null = null;
  let surfaceEl: HTMLDivElement | null = null;
  let itemRefs: HTMLButtonElement[] = [];
  let highlightIndex = 0;
  let fieldId = id ?? localId;
  let currentValue = value;
  let invalid = Boolean(error);
  let position = { left: 0, top: 0, placement: 'bottom' as Placement };
  let compiledCase = getSelectRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeSelectSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_SELECT_THEME.name ? defaultRegistration : createSelectRegistration(theme);
  $: fieldId = id ?? localId;
  $: if (value !== undefined) {
    currentValue = value;
  }
  $: invalid = Boolean(error);
  $: compiledCase = getSelectRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeSelectSlotStyles(compiledCase);
  $: selectedItem = findSelectedItem(items, currentValue);
  $: describedBy = error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined;
  $: if (internalOpen) {
    const selectedIndex = items.findIndex((item) => item.value === currentValue && !item.disabled);
    highlightIndex = selectedIndex >= 0 ? selectedIndex : Math.max(0, firstEnabledIndex(items));
    void syncPosition();
  }

  async function syncPosition(): Promise<void> {
    await tick();
    if (!triggerEl || !surfaceEl || typeof window === 'undefined') {
      return;
    }
    const anchor = triggerEl.getBoundingClientRect();
    const surface = surfaceEl.getBoundingClientRect();
    position = computeAnchoredPosition({
      anchor,
      surface: { width: surface.width || 300, height: surface.height || 280 },
      placement: 'bottom',
      offset: 8,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    });
    itemRefs[highlightIndex]?.focus();
  }

  function handleWindowClick(event: MouseEvent): void {
    if (!internalOpen) {
      return;
    }
    if (isEventOutside(surfaceEl, event.target) && isEventOutside(triggerEl, event.target)) {
      closeList();
    }
  }

  function emitChange(nextValue: string | undefined): void {
    currentValue = nextValue;
    value = nextValue;
    onChange?.({ value: nextValue });
    dispatch('change', { value: nextValue });
  }

  function openList(): void {
    internalOpen = true;
  }

  function closeList(): void {
    internalOpen = false;
    void tick().then(() => {
      triggerEl?.focus();
    });
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!internalOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        openList();
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'Escape') {
      closeList();
      return;
    }

    const nextIndex = nextListIndex(items, highlightIndex, event.key, { orientation: 'vertical' });
    if (nextIndex !== highlightIndex) {
      highlightIndex = nextIndex;
      itemRefs[nextIndex]?.focus();
      event.preventDefault();
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && items[highlightIndex] && !items[highlightIndex].disabled) {
      emitChange(items[highlightIndex].value);
      closeList();
      event.preventDefault();
    }
  }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<FieldFrame
  {label}
  {description}
  {error}
  {required}
  {disabled}
  {invalid}
  fieldId={fieldId}
  rootStyle={slotStyles.root}
  labelStyle={slotStyles.label}
  descriptionStyle={slotStyles.description}
  errorStyle={slotStyles.error}
>
  <input type="hidden" {name} value={currentValue} />

  <button
    bind:this={triggerEl}
    class="select-trigger"
    style={`${slotStyles.trigger} ${slotStyles.icon}`}
    type="button"
    aria-haspopup="listbox"
    aria-expanded={internalOpen ? 'true' : 'false'}
    aria-controls={`${fieldId}-listbox`}
    aria-describedby={describedBy}
    {disabled}
    onclick={() => {
      if (internalOpen) {
        closeList();
      } else {
        openList();
      }
    }}
  >
    <span class:selected={!selectedItem}>{selectedItem?.label ?? placeholder}</span>
    <span class="select-icon" aria-hidden="true">⌄</span>
  </button>
</FieldFrame>

{#if internalOpen}
  <div
    bind:this={surfaceEl}
    class="select-surface"
    style={`${slotStyles.surface}; left:${position.left}px; top:${position.top}px;`}
    role="listbox"
    id={`${fieldId}-listbox`}
    tabindex="-1"
  >
    {#each items as item, index (item.value)}
      <button
        bind:this={itemRefs[index]}
        class="select-item"
        style={`${slotStyles.item} ${slotStyles.itemLabel} ${slotStyles.itemDescription}`}
        type="button"
        role="option"
        aria-selected={currentValue === item.value ? 'true' : 'false'}
        data-selected={currentValue === item.value}
        data-highlighted={highlightIndex === index}
        disabled={item.disabled}
        onclick={() => {
          emitChange(item.value);
          closeList();
        }}
      >
        <span class="select-item-copy">
          <span class="select-item-label">{item.label}</span>
          {#if item.description}
            <span class="select-item-description">{item.description}</span>
          {/if}
        </span>
        {#if currentValue === item.value}
          <span aria-hidden="true">✓</span>
        {/if}
      </button>
    {/each}
  </div>
{/if}

<style>
  .select-trigger {
    align-items: center;
    background: var(--dk-select-trigger-bg);
    border: 1px solid var(--dk-select-trigger-border);
    border-radius: var(--dk-select-trigger-radius);
    color: var(--dk-select-trigger-fg);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    min-block-size: var(--dk-select-trigger-block-size);
    padding: 0 var(--dk-select-trigger-inline-padding);
    width: 100%;
  }

  .select-trigger:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--dk-select-trigger-border) 24%, transparent);
    outline-offset: 2px;
  }

  .select-trigger .selected {
    color: color-mix(in srgb, var(--dk-select-trigger-fg) 64%, transparent);
  }

  .select-icon {
    color: var(--dk-select-icon-color);
    font-size: var(--dk-select-icon-size);
  }

  .select-surface {
    background: var(--dk-select-surface-bg);
    border: 1px solid var(--dk-select-surface-border);
    border-radius: var(--dk-select-surface-radius);
    box-shadow: var(--dk-select-surface-shadow);
    color: var(--dk-select-surface-fg);
    inline-size: min(var(--dk-select-surface-width), calc(100vw - 2rem));
    padding: var(--dk-select-surface-padding);
    position: fixed;
    z-index: 45;
  }

  .select-item {
    align-items: center;
    background: var(--dk-select-item-bg);
    border: 0;
    border-radius: var(--dk-select-item-radius);
    color: var(--dk-select-item-fg);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    min-block-size: var(--dk-select-item-min-height);
    padding: 0 var(--dk-select-item-inline-padding);
    width: 100%;
  }

  .select-item[data-highlighted='true'],
  .select-item[data-selected='true'] {
    background: var(--dk-select-item-bg-selected, var(--dk-select-item-bg));
    color: var(--dk-select-item-fg-selected, var(--dk-select-item-fg));
  }

  .select-item-copy {
    display: grid;
    gap: 0.18rem;
    text-align: left;
  }

  .select-item-label {
    font-size: var(--dk-select-item-label-size);
    font-weight: var(--dk-select-item-label-weight);
  }

  .select-item-description {
    font-size: var(--dk-select-item-description-size);
    opacity: 0.78;
  }
</style>
