<script module lang="ts">
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

  type Props = {
    value?: string;
    items?: SelectItem[];
    label?: string;
    description?: string;
    error?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    name?: string;
    id?: string;
    size?: SelectSize;
    theme?: ThemeContract;
    onChange?: (detail: { value: string | undefined }) => void;
  };

  let {
    value = $bindable(undefined),
    items = $bindable([]),
    label = $bindable(),
    description = $bindable(),
    error = $bindable(),
    placeholder = $bindable('Select an option'),
    required = $bindable(false),
    disabled = $bindable(false),
    name = $bindable(),
    id = $bindable(),
    size = $bindable('md'),
    theme = $bindable(DEFAULT_SELECT_THEME),
    onChange = $bindable()
  }: Props = $props();

  const uid = $props.id();
  const defaultRegistration = createSelectRegistration(DEFAULT_SELECT_THEME);
  const dispatch = createEventDispatcher<{ change: { value: string | undefined } }>();
  const fieldId = $derived(id ?? `dk-select-${uid}`);
  const registration = $derived(theme.name === DEFAULT_SELECT_THEME.name ? defaultRegistration : createSelectRegistration(theme));
  const invalid = $derived(Boolean(error));
  const compiledCase = $derived(getSelectRecipeCase(registration.recipe, { size }));
  const slotStyles = $derived(serializeSelectSlotStyles(compiledCase));
  const selectedItem = $derived(findSelectedItem(items, value));
  const describedBy = $derived(error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined);

  let internalOpen = $state(false);
  let triggerEl = $state<HTMLButtonElement | null>(null);
  let surfaceEl = $state<HTMLDivElement | null>(null);
  let itemRefs = $state<HTMLButtonElement[]>([]);
  let highlightIndex = $state(-1);
  let viewportInlineSize = $state('100vw');
  let position = $state({ left: 0, top: 0, placement: 'bottom' as Placement });

  $effect(() => {
    if (disabled) internalOpen = false;
  });

  async function syncPosition(): Promise<void> {
    await tick();
    if (!internalOpen || !triggerEl || !surfaceEl) return;
    const rootZoom = Number.parseFloat(getComputedStyle(document.documentElement).zoom);
    const coordinateScale = Number.isFinite(rootZoom) && rootZoom > 0 ? rootZoom : 1;
    viewportInlineSize = `${window.innerWidth / coordinateScale}px`;
    await tick();
    if (!internalOpen || !triggerEl || !surfaceEl) return;
    const anchor = triggerEl.getBoundingClientRect();
    const surface = surfaceEl.getBoundingClientRect();
    position = computeAnchoredPosition({
      anchor,
      surface: { width: surface.width || 300, height: surface.height || 280 },
      placement: 'bottom',
      offset: 8,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      coordinateScale
    });
    itemRefs[highlightIndex]?.focus();
  }

  function handleOutsideEvent(event: MouseEvent | FocusEvent): void {
    if (internalOpen && isEventOutside(surfaceEl, event.target) && isEventOutside(triggerEl, event.target)) {
      closeList(false);
    }
  }

  function chooseItem(item: SelectItem): void {
    if (disabled || item.disabled) return;
    value = item.value;
    onChange?.({ value: item.value });
    dispatch('change', { value: item.value });
    closeList();
  }

  function openList(): void {
    if (disabled || internalOpen) return;
    const selectedIndex = items.findIndex((item) => item.value === value && !item.disabled);
    highlightIndex = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex(items);
    internalOpen = true;
    void syncPosition();
  }

  function closeList(restoreFocus = true): void {
    internalOpen = false;
    if (restoreFocus) void tick().then(() => triggerEl?.focus());
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
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
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
      highlightIndex = nextListIndex(items, highlightIndex, event.key, { orientation: 'vertical' });
      itemRefs[highlightIndex]?.focus();
      event.preventDefault();
    } else if ((event.key === 'Enter' || event.key === ' ') && items[highlightIndex]) {
      chooseItem(items[highlightIndex]);
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

  <button
    bind:this={triggerEl}
    class="select-trigger"
    id={fieldId}
    style={`${slotStyles.trigger} ${slotStyles.icon}`}
    type="button"
    aria-haspopup="listbox"
    aria-expanded={internalOpen ? 'true' : 'false'}
    aria-controls={`${fieldId}-listbox`}
    aria-describedby={describedBy}
    {disabled}
    onkeydown={handleKeydown}
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
    style={`${slotStyles.surface}; --dk-viewport-inline-size:${viewportInlineSize}; left:${position.left}px; top:${position.top}px;`}
    role="listbox"
    id={`${fieldId}-listbox`}
    tabindex="-1"
    onkeydown={handleKeydown}
  >
    {#each items as item, index (item.value)}
      <button
        bind:this={itemRefs[index]}
        class="select-item"
        style={`${slotStyles.item} ${slotStyles.itemLabel} ${slotStyles.itemDescription}`}
        type="button"
        role="option"
        aria-selected={value === item.value ? 'true' : 'false'}
        data-selected={value === item.value}
        data-highlighted={highlightIndex === index}
        disabled={item.disabled || disabled}
        tabindex="-1"
        onfocus={() => { highlightIndex = index; }}
        onclick={() => chooseItem(item)}
      >
        <span class="select-item-copy">
          <span class="select-item-label">{item.label}</span>
          {#if item.description}
            <span class="select-item-description">{item.description}</span>
          {/if}
        </span>
        {#if value === item.value}
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
    box-sizing: border-box;
    background: var(--dk-select-surface-bg);
    border: 1px solid var(--dk-select-surface-border);
    border-radius: var(--dk-select-surface-radius);
    box-shadow: var(--dk-select-surface-shadow);
    color: var(--dk-select-surface-fg);
    inline-size: min(var(--dk-select-surface-width), calc(var(--dk-viewport-inline-size, 100vw) - 2rem));
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
    min-inline-size: 0;
    overflow-wrap: anywhere;
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
