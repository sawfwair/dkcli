<script context="module" lang="ts">
  export type CommandPaletteItem = {
    id: string;
    label: string;
    section?: string;
    shortcut?: string;
    keywords?: string[];
    disabled?: boolean;
  };
</script>

<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import {
    filterCommandItems,
    firstEnabledCommandIndex,
    groupCommandItems,
    isEventOutside,
    nextListIndex,
    type CommandItem
  } from '../internal/behavior/index.js';
  import {
    COMMAND_PALETTE_CASE_KEYS,
    DEFAULT_COMMAND_PALETTE_THEME,
    createCommandPaletteRegistration,
    getCommandPaletteRecipeCase,
    serializeCommandPaletteSlotStyles
  } from './command-palette.recipe.js';

  const dispatch = createEventDispatcher<{
    openchange: { open: boolean };
    querychange: { query: string };
    action: { id: string };
  }>();

  export let open = false;
  export let items: CommandPaletteItem[] = [];
  export let query = '';
  export let placeholder = 'Search commands';
  export let emptyTitle = 'No commands found';
  export let emptyDescription = 'Try a broader search or clear the query.';
  export let hotkey: 'mod+k' | false = false;
  export let theme: ThemeContract = DEFAULT_COMMAND_PALETTE_THEME;
  export let onOpenChange: ((detail: { open: boolean }) => void) | undefined = undefined;
  export let onQueryChange: ((detail: { query: string }) => void) | undefined = undefined;
  export let onAction: ((detail: { id: string }) => void) | undefined = undefined;

  const defaultRegistration = createCommandPaletteRegistration(DEFAULT_COMMAND_PALETTE_THEME);

  let registration = defaultRegistration;
  let compiledCase = getCommandPaletteRecipeCase(defaultRegistration.recipe);
  let slotStyles = serializeCommandPaletteSlotStyles(compiledCase);
  let internalOpen = open;
  let internalQuery = query;
  let previousOpen = open;
  let previousQuery = query;
  let highlightIndex = 0;
  let restoreFocusEl: HTMLElement | null = null;
  let surfaceEl: HTMLDivElement | null = null;
  let inputEl: HTMLInputElement | null = null;
  let itemRefs: HTMLButtonElement[] = [];
  let ignoreOutsideClickUntil = 0;

  $: registration =
    theme.name === DEFAULT_COMMAND_PALETTE_THEME.name
      ? defaultRegistration
      : createCommandPaletteRegistration(theme);
  $: compiledCase = getCommandPaletteRecipeCase(registration.recipe);
  $: slotStyles = serializeCommandPaletteSlotStyles(compiledCase);
  $: if (open !== previousOpen) {
    internalOpen = open;
    previousOpen = open;
    if (internalOpen) {
      ignoreOpeningClick();
      void focusInput();
    }
  }
  $: if (query !== previousQuery) {
    internalQuery = query;
    previousQuery = query;
  }
  $: filteredItems = filterCommandItems(items as CommandItem[], internalQuery);
  $: groupedItems = groupCommandItems(filteredItems);
  $: if (internalOpen && filteredItems.length > 0 && (highlightIndex < 0 || filteredItems[highlightIndex]?.disabled)) {
    highlightIndex = firstEnabledCommandIndex(filteredItems);
  }

  async function focusInput(): Promise<void> {
    await tick();
    inputEl?.focus();
    inputEl?.select();
  }

  function ignoreOpeningClick(): void {
    ignoreOutsideClickUntil = performance.now() + 120;
  }

  function emitOpen(nextOpen: boolean): void {
    internalOpen = nextOpen;
    open = nextOpen;
    previousOpen = nextOpen;
    if (nextOpen) {
      ignoreOpeningClick();
    }
    onOpenChange?.({ open: nextOpen });
    dispatch('openchange', { open: nextOpen });
  }

  function emitQuery(nextQuery: string): void {
    internalQuery = nextQuery;
    query = nextQuery;
    previousQuery = nextQuery;
    onQueryChange?.({ query: nextQuery });
    dispatch('querychange', { query: nextQuery });
    highlightIndex = firstEnabledCommandIndex(filterCommandItems(items as CommandItem[], nextQuery));
  }

  function openPalette(): void {
    if (internalOpen) {
      return;
    }
    restoreFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    emitOpen(true);
    void focusInput();
  }

  function closePalette(): void {
    if (!internalOpen) {
      return;
    }
    emitOpen(false);
    void tick().then(() => {
      restoreFocusEl?.focus();
    });
  }

  function runAction(item: CommandPaletteItem): void {
    if (item.disabled) {
      return;
    }
    emitQuery(item.label);
    onAction?.({ id: item.id });
    dispatch('action', { id: item.id });
    closePalette();
  }

  function highlightNext(key: string): void {
    const nextIndex = nextListIndex(filteredItems, highlightIndex, key, { orientation: 'vertical' });
    if (nextIndex !== highlightIndex) {
      highlightIndex = nextIndex;
      void tick().then(() => {
        itemRefs[nextIndex]?.focus();
      });
    }
  }

  function handleInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      closePalette();
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      highlightNext(event.key);
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter' && filteredItems[highlightIndex]) {
      runAction(filteredItems[highlightIndex]);
      event.preventDefault();
    }
  }

  function handleItemKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      closePalette();
      event.preventDefault();
      return;
    }

    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      highlightNext(event.key);
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      const item = filteredItems[highlightIndex];
      if (item) {
        runAction(item);
      }
      event.preventDefault();
    }
  }

  function handleWindowKeydown(event: KeyboardEvent): void {
    const modPressed = event.metaKey || event.ctrlKey;
    if (hotkey === 'mod+k' && modPressed && event.key.toLowerCase() === 'k') {
      if (internalOpen) {
        closePalette();
      } else {
        openPalette();
      }
      event.preventDefault();
      return;
    }

    if (internalOpen && event.key === 'Escape') {
      closePalette();
      event.preventDefault();
    }
  }

  function handleWindowClick(event: MouseEvent): void {
    if (!internalOpen) {
      return;
    }
    // Ignore the click that opened the palette so pointer activation does not
    // immediately dismiss the surface before focus is moved inside.
    if (!surfaceEl || performance.now() < ignoreOutsideClickUntil) {
      return;
    }
    if (isEventOutside(surfaceEl, event.target)) {
      closePalette();
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} onclick={handleWindowClick} />

{#if internalOpen}
  <div class="command-root" style={slotStyles.root}>
    <div class="command-backdrop" style={slotStyles.backdrop}></div>
    <div
      bind:this={surfaceEl}
      class="command-surface"
      style={slotStyles.surface}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <input
        bind:this={inputEl}
        class="command-input"
        style={slotStyles.input}
        role="combobox"
        aria-expanded="true"
        aria-controls="dk-command-palette-listbox"
        aria-activedescendant={filteredItems[highlightIndex] ? `command-item-${filteredItems[highlightIndex].id}` : undefined}
        {placeholder}
        value={internalQuery}
        oninput={(event) => emitQuery((event.currentTarget as HTMLInputElement).value)}
        onkeydown={handleInputKeydown}
      />

      <div class="command-list" id="dk-command-palette-listbox" role="listbox">
        {#if filteredItems.length === 0}
          <div class="command-empty" style={slotStyles.empty}>
            <strong>{emptyTitle}</strong>
            <p>{emptyDescription}</p>
          </div>
        {:else}
          {#each groupedItems as group}
            <section class="command-group" aria-label={group.section}>
              <h3 class="command-section" style={slotStyles.section}>{group.section}</h3>
              <div class="command-items">
                {#each group.items as item}
                  {@const itemIndex = filteredItems.findIndex((entry) => entry.id === item.id)}
                  <button
                    bind:this={itemRefs[itemIndex]}
                    id={`command-item-${item.id}`}
                    class="command-item"
                    style={`${slotStyles.item} ${slotStyles.itemLabel} ${slotStyles.itemMeta}`}
                    type="button"
                    role="option"
                    aria-selected={itemIndex === highlightIndex ? 'true' : 'false'}
                    data-highlighted={itemIndex === highlightIndex}
                    data-disabled={item.disabled ? 'true' : 'false'}
                    disabled={item.disabled}
                    onclick={() => runAction(item)}
                    onfocus={() => {
                      highlightIndex = itemIndex;
                    }}
                    onkeydown={handleItemKeydown}
                  >
                    <span class="command-copy">
                      <span class="command-label">{item.label}</span>
                      {#if item.section || item.keywords?.length}
                        <span class="command-meta">{item.keywords?.join(', ')}</span>
                      {/if}
                    </span>
                    {#if item.shortcut}
                      <span class="command-shortcut">{item.shortcut}</span>
                    {/if}
                  </button>
                {/each}
              </div>
            </section>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .command-root {
    inset: 0;
    position: fixed;
    z-index: 70;
  }

  .command-backdrop {
    background: var(--dk-command-backdrop-bg);
    inset: 0;
    position: absolute;
  }

  .command-surface {
    background: var(--dk-command-surface-bg);
    border: 1px solid var(--dk-command-surface-border);
    border-radius: var(--dk-command-surface-radius);
    box-shadow: var(--dk-command-surface-shadow);
    color: var(--dk-command-surface-fg);
    display: grid;
    gap: var(--dk-command-gap);
    inline-size: var(--dk-command-surface-width);
    inset: var(--dk-command-offset) 1rem auto;
    margin-inline: auto;
    max-block-size: var(--dk-command-surface-max-height);
    overflow: hidden;
    padding: var(--dk-command-surface-padding);
    position: absolute;
  }

  .command-input {
    appearance: none;
    background: var(--dk-command-input-bg);
    border: 1px solid var(--dk-command-input-border);
    border-radius: var(--dk-command-input-radius);
    color: var(--dk-command-input-fg);
    font-size: var(--dk-command-input-font-size);
    inline-size: 100%;
    min-block-size: var(--dk-command-input-block-size);
    padding-inline: var(--dk-command-input-inline-padding);
  }

  .command-input:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--dk-command-input-border) 24%, transparent);
    outline-offset: 2px;
  }

  .command-list {
    display: grid;
    gap: 0.75rem;
    max-block-size: calc(var(--dk-command-surface-max-height) - 4rem);
    overflow: auto;
    padding-right: 0.25rem;
  }

  .command-group,
  .command-items,
  .command-copy,
  .command-empty {
    display: grid;
  }

  .command-group,
  .command-items {
    gap: 0.35rem;
  }

  .command-section {
    color: var(--dk-command-section-fg);
    font-size: var(--dk-command-section-size);
    letter-spacing: 0.08em;
    margin: 0;
    padding-inline: 0.25rem;
    text-transform: uppercase;
  }

  .command-item {
    align-items: center;
    background: var(--dk-command-item-bg);
    border: 0;
    border-radius: var(--dk-command-item-radius);
    color: var(--dk-command-item-fg);
    cursor: pointer;
    display: grid;
    gap: 0.75rem;
    grid-template-columns: minmax(0, 1fr) auto;
    min-block-size: var(--dk-command-item-min-height);
    padding-inline: var(--dk-command-item-inline-padding);
    text-align: left;
  }

  .command-item[data-highlighted='true'] {
    background: var(--dk-command-item-bg-hover, var(--dk-command-item-bg));
    color: var(--dk-command-item-fg-hover, var(--dk-command-item-fg));
  }

  .command-item[data-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .command-label {
    font-size: var(--dk-command-item-label-size);
    font-weight: var(--dk-command-item-label-weight);
  }

  .command-meta,
  .command-shortcut,
  .command-empty {
    color: var(--dk-command-item-meta-fg);
    font-size: var(--dk-command-item-meta-size);
  }

  .command-empty {
    gap: 0.25rem;
    padding: 0.75rem;
  }

  .command-empty p {
    margin: 0;
  }
 </style>
