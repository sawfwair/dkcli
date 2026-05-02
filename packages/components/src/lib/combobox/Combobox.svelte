<script context="module" lang="ts">
  export type ComboboxItem = {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  };
</script>

<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import {
    computeAnchoredPosition,
    findSelectedItem,
    firstEnabledIndex,
    isEventOutside,
    nextListIndex,
    type Placement
  } from '../internal/behavior/index.js';
  import { FieldFrame } from '../primitives/index.js';
  import {
    DEFAULT_COMBOBOX_THEME,
    createComboboxRegistration,
    getComboboxRecipeCase,
    serializeComboboxSlotStyles
  } from './combobox.recipe.js';
  import type { ComboboxSize } from './combobox.spec.js';

  let nextId = 0;

  export let value: string | undefined = undefined;
  export let items: ComboboxItem[] = [];
  export let label: string | undefined = undefined;
  export let description: string | undefined = undefined;
  export let error: string | undefined = undefined;
  export let placeholder = 'Search options';
  export let required = false;
  export let disabled = false;
  export let name: string | undefined = undefined;
  export let id: string | undefined = undefined;
  export let size: ComboboxSize = 'md';
  export let theme: ThemeContract = DEFAULT_COMBOBOX_THEME;
  export let onChange: ((detail: { value: string | undefined }) => void) | undefined = undefined;

  const defaultRegistration = createComboboxRegistration(DEFAULT_COMBOBOX_THEME);
  const dispatch = createEventDispatcher<{ change: { value: string | undefined } }>();
  const localId = `dk-combobox-${++nextId}`;

  let registration = defaultRegistration;
  let internalOpen = false;
  let inputEl: HTMLInputElement | null = null;
  let surfaceEl: HTMLDivElement | null = null;
  let itemRefs: HTMLButtonElement[] = [];
  let highlightIndex = 0;
  let fieldId = id ?? localId;
  let currentValue = value;
  let query = '';
  let suppressNextFocusOpen = false;
  let invalid = Boolean(error);
  let position = { left: 0, top: 0, placement: 'bottom' as Placement };
  let compiledCase = getComboboxRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeComboboxSlotStyles(compiledCase);

  $: registration =
    theme.name === DEFAULT_COMBOBOX_THEME.name ? defaultRegistration : createComboboxRegistration(theme);
  $: fieldId = id ?? localId;
  $: if (value !== undefined) {
    currentValue = value;
  }
  $: invalid = Boolean(error);
  $: compiledCase = getComboboxRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeComboboxSlotStyles(compiledCase);
  $: selectedItem = findSelectedItem(items, currentValue);
  $: if (!internalOpen) {
    query = selectedItem?.label ?? '';
  }
  $: filteredItems = query.trim()
    ? items.filter((item) => {
        const haystack = `${item.label} ${item.description ?? ''}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      })
    : items;
  $: describedBy = error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined;
  $: if (internalOpen) {
    highlightIndex = Math.max(0, firstEnabledIndex(filteredItems));
    void syncPosition();
  }

  async function syncPosition(): Promise<void> {
    await tick();
    if (!inputEl || !surfaceEl || typeof window === 'undefined') {
      return;
    }
    const anchor = inputEl.getBoundingClientRect();
    const surface = surfaceEl.getBoundingClientRect();
    position = computeAnchoredPosition({
      anchor,
      surface: { width: surface.width || 320, height: surface.height || 280 },
      placement: 'bottom',
      offset: 8,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    });
    itemRefs[highlightIndex]?.focus();
  }

  function restoreInputFocus(): void {
    suppressNextFocusOpen = true;
    void tick().then(() => {
      const focusInput = () => {
        const nextInput = (document.getElementById(fieldId) as HTMLInputElement | null) ?? inputEl;
        nextInput?.focus();
      };
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          focusInput();
        }, 0);
        return;
      }
      focusInput();
    });
  }

  function openList(): void {
    if (disabled) {
      return;
    }
    if (!internalOpen && selectedItem && query === selectedItem.label) {
      query = '';
    }
    internalOpen = true;
  }

  function closeList(): void {
    internalOpen = false;
    query = selectedItem?.label ?? '';
    restoreInputFocus();
  }

  function selectItem(item: ComboboxItem): void {
    currentValue = item.value;
    value = item.value;
    query = item.label;
    internalOpen = false;
    onChange?.({ value: item.value });
    dispatch('change', { value: item.value });
    restoreInputFocus();
  }

  function handleWindowClick(event: MouseEvent): void {
    if (!internalOpen) {
      return;
    }
    if (isEventOutside(surfaceEl, event.target) && isEventOutside(inputEl, event.target)) {
      closeList();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!internalOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        openList();
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'Escape') {
      closeList();
      return;
    }

    const nextIndex = nextListIndex(filteredItems, highlightIndex, event.key, { orientation: 'vertical' });
    if (nextIndex !== highlightIndex) {
      highlightIndex = nextIndex;
      itemRefs[nextIndex]?.focus();
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter' && filteredItems[highlightIndex] && !filteredItems[highlightIndex].disabled) {
      selectItem(filteredItems[highlightIndex]);
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

  <div class="combobox-trigger" style={slotStyles.icon}>
    <input
      bind:this={inputEl}
      class="combobox-input"
      style={slotStyles.input}
      id={fieldId}
      role="combobox"
      aria-expanded={internalOpen ? 'true' : 'false'}
      aria-autocomplete="list"
      aria-controls={`${fieldId}-listbox`}
      aria-describedby={describedBy}
      aria-invalid={invalid ? 'true' : 'false'}
      {disabled}
      {placeholder}
      value={query}
      onfocus={() => {
        if (suppressNextFocusOpen) {
          suppressNextFocusOpen = false;
          return;
        }
        openList();
      }}
      onkeydown={handleKeydown}
      oninput={(event) => {
        query = (event.currentTarget as HTMLInputElement).value;
        internalOpen = true;
      }}
    />
    <span class="combobox-icon" aria-hidden="true">⌄</span>
  </div>
</FieldFrame>

{#if internalOpen}
  <div
    bind:this={surfaceEl}
    class="combobox-surface"
    style={`${slotStyles.surface}; left:${position.left}px; top:${position.top}px;`}
    role="listbox"
    id={`${fieldId}-listbox`}
    tabindex="-1"
    onkeydown={handleKeydown}
  >
    {#if filteredItems.length === 0}
      <div class="combobox-empty" style={slotStyles.itemDescription}>No matches found.</div>
    {:else}
      {#each filteredItems as item, index (item.value)}
        <button
          bind:this={itemRefs[index]}
          class="combobox-item"
          style={`${slotStyles.item} ${slotStyles.itemLabel} ${slotStyles.itemDescription}`}
          type="button"
          role="option"
        aria-selected={currentValue === item.value ? 'true' : 'false'}
        data-selected={currentValue === item.value}
        data-highlighted={highlightIndex === index}
        disabled={item.disabled}
        onmousedown={(event) => {
          event.preventDefault();
        }}
        onclick={() => selectItem(item)}
      >
          <span class="combobox-item-copy">
            <span class="combobox-item-label">{item.label}</span>
            {#if item.description}
              <span class="combobox-item-description">{item.description}</span>
            {/if}
          </span>
          {#if currentValue === item.value}
            <span aria-hidden="true">✓</span>
          {/if}
        </button>
      {/each}
    {/if}
  </div>
{/if}

<style>
  .combobox-trigger {
    position: relative;
  }

  .combobox-input {
    appearance: none;
    background: var(--dk-combobox-input-bg);
    border: 1px solid var(--dk-combobox-input-border);
    border-radius: var(--dk-combobox-input-radius);
    color: var(--dk-combobox-input-fg);
    inline-size: 100%;
    min-block-size: var(--dk-combobox-input-block-size);
    padding: 0 calc(var(--dk-combobox-input-inline-padding) + 1.1rem) 0
      var(--dk-combobox-input-inline-padding);
  }

  .combobox-input::placeholder {
    color: color-mix(in srgb, var(--dk-combobox-input-fg) 60%, transparent);
  }

  .combobox-input:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--dk-combobox-input-border-open, var(--dk-combobox-input-border)) 24%, transparent);
    outline-offset: 2px;
  }

  .combobox-input[aria-invalid='true'] {
    border-color: var(--dk-combobox-input-border-invalid, var(--dk-combobox-input-border));
  }

  .combobox-icon {
    color: var(--dk-combobox-icon-color);
    font-size: var(--dk-combobox-icon-size);
    inset: 50% var(--dk-combobox-input-inline-padding) auto auto;
    pointer-events: none;
    position: absolute;
    transform: translateY(-50%);
  }

  .combobox-surface {
    background: var(--dk-combobox-surface-bg);
    border: 1px solid var(--dk-combobox-surface-border);
    border-radius: var(--dk-combobox-surface-radius);
    box-shadow: var(--dk-combobox-surface-shadow);
    color: var(--dk-combobox-surface-fg);
    inline-size: min(var(--dk-combobox-surface-width), calc(100vw - 2rem));
    padding: var(--dk-combobox-surface-padding);
    position: fixed;
    z-index: 45;
  }

  .combobox-empty {
    color: var(--dk-field-description-color);
    padding: 0.75rem var(--dk-combobox-item-inline-padding);
  }

  .combobox-item {
    align-items: center;
    background: var(--dk-combobox-item-bg);
    border: 0;
    border-radius: var(--dk-combobox-item-radius);
    color: var(--dk-combobox-item-fg);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    min-block-size: var(--dk-combobox-item-min-height);
    padding: 0 var(--dk-combobox-item-inline-padding);
    width: 100%;
  }

  .combobox-item[data-highlighted='true'] {
    background: var(--dk-combobox-item-bg-hover, var(--dk-combobox-item-bg));
    color: var(--dk-combobox-item-fg-hover, var(--dk-combobox-item-fg));
  }

  .combobox-item[data-selected='true'] {
    background: var(--dk-combobox-item-bg-selected, var(--dk-combobox-item-bg));
    color: var(--dk-combobox-item-fg-selected, var(--dk-combobox-item-fg));
  }

  .combobox-item-copy {
    display: grid;
    gap: 0.15rem;
    padding-block: 0.5rem;
    text-align: left;
  }

  .combobox-item-label {
    font-size: var(--dk-combobox-item-label-size);
    font-weight: var(--dk-combobox-item-label-weight);
  }

  .combobox-item-description {
    font-size: var(--dk-combobox-item-description-size);
    opacity: 0.82;
  }
</style>
