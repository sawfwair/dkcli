<script context="module" lang="ts">
  export type MenuItem = {
    value: string;
    label: string;
    shortcut?: string;
    disabled?: boolean;
    destructive?: boolean;
  };
</script>

<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import { computeAnchoredPosition, firstEnabledIndex, isEventOutside, nextListIndex, type Placement } from '../internal/behavior/index.js';
  import {
    DEFAULT_MENU_THEME,
    createMenuRegistration,
    getMenuRecipeCase,
    serializeMenuSlotStyles
  } from './menu.recipe.js';
  import type { MenuSize } from './menu.spec.js';

  const dispatch = createEventDispatcher<{ openchange: { open: boolean } }>();

  export let open = false;
  export let items: MenuItem[] = [];
  export let placement: Placement = 'bottom';
  export let size: MenuSize = 'md';
  export let theme: ThemeContract = DEFAULT_MENU_THEME;
  export let onOpenChange: ((detail: { open: boolean }) => void) | undefined = undefined;

  const defaultRegistration = createMenuRegistration(DEFAULT_MENU_THEME);

  let registration = defaultRegistration;
  let internalOpen = open;
  let previousOpen = open;
  let triggerEl: HTMLButtonElement | null = null;
  let surfaceEl: HTMLDivElement | null = null;
  let currentValue: string | undefined = undefined;
  let highlightIndex = 0;
  let itemRefs: HTMLButtonElement[] = [];
  let position = { left: 0, top: 0, placement };
  let compiledCase = getMenuRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeMenuSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_MENU_THEME.name ? defaultRegistration : createMenuRegistration(theme);
  $: if (open !== previousOpen) {
    internalOpen = open;
    previousOpen = open;
  }
  $: compiledCase = getMenuRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeMenuSlotStyles(compiledCase);
  $: if (internalOpen) {
    highlightIndex = Math.max(0, firstEnabledIndex(items));
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
      surface: { width: surface.width || 260, height: surface.height || 280 },
      placement,
      offset: 12,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    });
    itemRefs[highlightIndex]?.focus();
  }

  function setOpen(nextOpen: boolean): void {
    if (internalOpen === nextOpen) {
      return;
    }
    internalOpen = nextOpen;
    open = nextOpen;
    previousOpen = nextOpen;
    onOpenChange?.({ open: nextOpen });
    dispatch('openchange', { open: nextOpen });
    if (!nextOpen) {
      void tick().then(() => {
        triggerEl?.focus();
      });
    }
  }

  function closeMenu(): void {
    setOpen(false);
  }

  function handleWindowClick(event: MouseEvent): void {
    if (!internalOpen) {
      return;
    }
    if (isEventOutside(surfaceEl, event.target) && isEventOutside(triggerEl, event.target)) {
      closeMenu();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!internalOpen) {
      return;
    }

    if (event.key === 'Escape') {
      closeMenu();
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
      currentValue = items[highlightIndex].value;
      closeMenu();
      event.preventDefault();
    }
  }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<button
  bind:this={triggerEl}
  type="button"
  class="menu-trigger"
  aria-haspopup="menu"
  aria-expanded={internalOpen ? 'true' : 'false'}
  onclick={() => {
    setOpen(!internalOpen);
  }}
>
  <slot name="trigger">Open menu</slot>
</button>

{#if internalOpen}
  <div
    bind:this={surfaceEl}
    class="menu-surface"
    style={`${slotStyles.surface}; left:${position.left}px; top:${position.top}px;`}
    role="menu"
  >
    {#each items as item, index (item.value)}
      <button
        bind:this={itemRefs[index]}
        type="button"
        class="menu-item"
        style={`${slotStyles.item} ${slotStyles.label} ${slotStyles.shortcut}`}
        role="menuitem"
        data-selected={currentValue === item.value}
        data-highlighted={highlightIndex === index}
        data-destructive={item.destructive}
        disabled={item.disabled}
        onclick={() => {
          currentValue = item.value;
          closeMenu();
        }}
      >
        <span class="menu-label">{item.label}</span>
        {#if item.shortcut}
          <span class="menu-shortcut">{item.shortcut}</span>
        {/if}
      </button>
    {/each}
  </div>
{/if}

<style>
  .menu-trigger {
    background: transparent;
    border: 0;
    padding: 0;
  }

  .menu-surface {
    background: var(--dk-menu-surface-bg);
    border: 1px solid var(--dk-menu-surface-border);
    border-radius: var(--dk-menu-surface-radius);
    box-shadow: var(--dk-menu-surface-shadow);
    color: var(--dk-menu-surface-fg);
    inline-size: var(--dk-menu-surface-width);
    padding: var(--dk-menu-surface-padding);
    position: fixed;
    z-index: 45;
  }

  .menu-item {
    align-items: center;
    background: var(--dk-menu-item-bg);
    border: 0;
    border-radius: var(--dk-menu-item-radius);
    color: var(--dk-menu-item-fg);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    min-block-size: var(--dk-menu-item-min-height);
    padding: 0 var(--dk-menu-item-inline-padding);
    width: 100%;
  }

  .menu-item[data-highlighted='true'],
  .menu-item[data-selected='true'] {
    background: var(--dk-menu-item-bg-selected, var(--dk-menu-item-bg));
    color: var(--dk-menu-item-fg-selected, var(--dk-menu-item-fg));
  }

  .menu-item[data-destructive='true'] {
    color: #b42318;
  }

  .menu-label {
    font-size: var(--dk-menu-label-size);
    font-weight: var(--dk-menu-label-weight);
  }

  .menu-shortcut {
    font-size: var(--dk-menu-shortcut-size);
    opacity: 0.7;
  }
</style>
