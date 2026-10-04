<script module lang="ts">
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

  type Props = {
    value?: string;
    items?: ComboboxItem[];
    label?: string;
    description?: string;
    error?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    name?: string;
    id?: string;
    size?: ComboboxSize;
    theme?: ThemeContract;
    onChange?: (detail: { value: string | undefined }) => void;
  };

  let {
    value = $bindable(undefined),
    items = $bindable([]),
    label = $bindable(),
    description = $bindable(),
    error = $bindable(),
    placeholder = $bindable('Search options'),
    required = $bindable(false),
    disabled = $bindable(false),
    name = $bindable(),
    id = $bindable(),
    size = $bindable('md'),
    theme = $bindable(DEFAULT_COMBOBOX_THEME),
    onChange = $bindable()
  }: Props = $props();

  const uid = $props.id();
  const defaultRegistration = createComboboxRegistration(DEFAULT_COMBOBOX_THEME);
  const dispatch = createEventDispatcher<{ change: { value: string | undefined } }>();
  const fieldId = $derived(id ?? `dk-combobox-${uid}`);
  const registration = $derived(theme.name === DEFAULT_COMBOBOX_THEME.name ? defaultRegistration : createComboboxRegistration(theme));
  const invalid = $derived(Boolean(error));
  const compiledCase = $derived(getComboboxRecipeCase(registration.recipe, { size }));
  const slotStyles = $derived(serializeComboboxSlotStyles(compiledCase));
  const selectedItem = $derived(findSelectedItem(items, value));
  const describedBy = $derived(error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined);

  let internalOpen = $state(false);
  let inputEl = $state<HTMLInputElement | null>(null);
  let surfaceEl = $state<HTMLDivElement | null>(null);
  let highlightIndex = $state(-1);
  let query = $state('');
  let suppressNextFocusOpen = false;
  let viewportInlineSize = $state('100vw');
  let position = $state({ left: 0, top: 0, placement: 'bottom' as Placement });
  const displayQuery = $derived(internalOpen ? query : selectedItem?.label ?? '');
  const filteredItems = $derived(query.trim()
    ? items.filter((item) => {
        const haystack = `${item.label} ${item.description ?? ''}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      })
    : items);

  $effect(() => {
    if (disabled) internalOpen = false;
  });

  async function syncPosition(): Promise<void> {
    await tick();
    if (!internalOpen || !inputEl || !surfaceEl) return;
    const rootZoom = Number.parseFloat(getComputedStyle(document.documentElement).zoom);
    const coordinateScale = Number.isFinite(rootZoom) && rootZoom > 0 ? rootZoom : 1;
    viewportInlineSize = `${window.innerWidth / coordinateScale}px`;
    await tick();
    if (!internalOpen || !inputEl || !surfaceEl) return;
    const anchor = inputEl.getBoundingClientRect();
    const surface = surfaceEl.getBoundingClientRect();
    position = computeAnchoredPosition({
      anchor,
      surface: { width: surface.width || 320, height: surface.height || 280 },
      placement: 'bottom',
      offset: 8,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      coordinateScale
    });
  }

  function restoreInputFocus(): void {
    void tick().then(() => {
      if (inputEl && document.activeElement !== inputEl) {
        suppressNextFocusOpen = true;
        inputEl.focus();
      }
    });
  }

  function openList(): void {
    if (disabled || internalOpen) return;
    query = '';
    highlightIndex = firstEnabledIndex(items);
    internalOpen = true;
    void syncPosition();
  }

  function closeList(restoreFocus = true): void {
    internalOpen = false;
    if (restoreFocus) restoreInputFocus();
  }

  function selectItem(item: ComboboxItem): void {
    if (disabled || item.disabled) return;
    value = item.value;
    onChange?.({ value: item.value });
    dispatch('change', { value: item.value });
    closeList();
  }

  function handleOutsideEvent(event: MouseEvent | FocusEvent): void {
    if (internalOpen && isEventOutside(surfaceEl, event.target) && isEventOutside(inputEl, event.target)) {
      closeList(false);
    }
  }

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (internalOpen && event.key === 'Escape') {
      closeList();
      event.preventDefault();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (disabled) return;
    if (!internalOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        openList();
        event.preventDefault();
      }
      return;
    }
    if (event.key === 'Escape') {
      closeList();
      event.preventDefault();
      return;
    }
    if (event.key === 'Tab') {
      closeList(false);
      return;
    }

    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      highlightIndex = nextListIndex(filteredItems, highlightIndex, event.key, { orientation: 'vertical' });
      event.preventDefault();
    } else if (event.key === 'Enter' && filteredItems[highlightIndex]) {
      selectItem(filteredItems[highlightIndex]);
      event.preventDefault();
    }
  }
</script>

<svelte:window onclick={handleOutsideEvent} onfocusin={handleOutsideEvent} onkeydown={handleWindowKeydown} />

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
  <input type="hidden" {name} {value} {disabled} />

  <div class="combobox-trigger" style={`${slotStyles.input}; ${slotStyles.icon}`}>
    <input
      bind:this={inputEl}
      class="combobox-input"
      style={slotStyles.input}
      id={fieldId}
      role="combobox"
      aria-expanded={internalOpen ? 'true' : 'false'}
      aria-autocomplete="list"
      aria-activedescendant={internalOpen && filteredItems[highlightIndex] ? `${fieldId}-option-${highlightIndex}` : undefined}
      aria-controls={`${fieldId}-listbox`}
      aria-describedby={describedBy}
      aria-invalid={invalid ? 'true' : 'false'}
      {disabled}
      {placeholder}
      value={displayQuery}
      onfocus={() => {
        if (suppressNextFocusOpen) {
          suppressNextFocusOpen = false;
          return;
        }
        openList();
      }}
      onkeydown={handleKeydown}
      oninput={(event) => {
        if (disabled) return;
        openList();
        query = (event.currentTarget as HTMLInputElement).value;
        highlightIndex = firstEnabledIndex(filteredItems);
        void syncPosition();
      }}
    />
    <span class="combobox-icon" aria-hidden="true">⌄</span>
  </div>
</FieldFrame>

{#if internalOpen}
  <div
    bind:this={surfaceEl}
    class="combobox-surface"
    style={`${slotStyles.surface}; --dk-viewport-inline-size:${viewportInlineSize}; left:${position.left}px; top:${position.top}px;`}
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
          class="combobox-item"
          style={`${slotStyles.item} ${slotStyles.itemLabel} ${slotStyles.itemDescription}`}
          type="button"
          role="option"
          id={`${fieldId}-option-${index}`}
          tabindex="-1"
          aria-selected={value === item.value ? 'true' : 'false'}
          data-selected={value === item.value}
          data-highlighted={highlightIndex === index}
          disabled={item.disabled || disabled}
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
          {#if value === item.value}
            <span aria-hidden="true">✓</span>
          {/if}
        </button>
      {/each}
    {/if}
  </div>
{/if}

<style>
  .combobox-trigger {
    min-inline-size: 0;
    position: relative;
  }

  .combobox-input {
    appearance: none;
    background: var(--dk-combobox-input-bg);
    border: 1px solid var(--dk-combobox-input-border);
    border-radius: var(--dk-combobox-input-radius);
    box-sizing: border-box;
    color: var(--dk-combobox-input-fg);
    display: block;
    inline-size: 100%;
    min-block-size: var(--dk-combobox-input-block-size);
    min-inline-size: 0;
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
    box-sizing: border-box;
    background: var(--dk-combobox-surface-bg);
    border: 1px solid var(--dk-combobox-surface-border);
    border-radius: var(--dk-combobox-surface-radius);
    box-shadow: var(--dk-combobox-surface-shadow);
    color: var(--dk-combobox-surface-fg);
    inline-size: min(var(--dk-combobox-surface-width), calc(var(--dk-viewport-inline-size, 100vw) - 2rem));
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
    grid-template-columns: minmax(0, 1fr);
    min-inline-size: 0;
    padding-block: 0.5rem;
    text-align: left;
  }

  .combobox-item-label,
  .combobox-item-description {
    min-inline-size: 0;
    overflow-wrap: anywhere;
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
