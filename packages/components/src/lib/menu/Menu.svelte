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

  const dispatch = createEventDispatcher<{
    openchange: { open: boolean };
    action: { value: string };
  }>();

  export let open = false;
  export let items: MenuItem[] = [];
  export let placement: Placement = 'bottom';
  export let size: MenuSize = 'md';
  export let theme: ThemeContract = DEFAULT_MENU_THEME;
  export let onOpenChange: ((detail: { open: boolean }) => void) | undefined = undefined;
  export let onAction: ((detail: { value: string }) => void) | undefined = undefined;

  const defaultRegistration = createMenuRegistration(DEFAULT_MENU_THEME);

  let registration = defaultRegistration;
  let internalOpen = open;
  let previousOpen = open;
  let triggerEl: HTMLButtonElement | null = null;
  let surfaceEl: HTMLDivElement | null = null;
  let currentValue: string | undefined = undefined;
  let highlightIndex = 0;
  let itemRefs: HTMLButtonElement[] = [];
  let viewportInlineSize = '100vw';
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
    const rootZoom = Number.parseFloat(getComputedStyle(document.documentElement).zoom);
    const coordinateScale = Number.isFinite(rootZoom) && rootZoom > 0 ? rootZoom : 1;
    viewportInlineSize = `${window.innerWidth / coordinateScale}px`;
    await tick();
    if (!internalOpen || !triggerEl || !surfaceEl) return;
    const anchor = triggerEl.getBoundingClientRect();
    const surface = surfaceEl.getBoundingClientRect();
    position = computeAnchoredPosition({
      anchor,
      surface: { width: surface.width || 260, height: surface.height || 280 },
      placement,
      offset: 12,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      coordinateScale
    });
    itemRefs[highlightIndex]?.focus();
  }

  function setOpen(nextOpen: boolean, restoreFocus = true): void {
    if (internalOpen === nextOpen) {
      return;
    }
    internalOpen = nextOpen;
    open = nextOpen;
    previousOpen = nextOpen;
    onOpenChange?.({ open: nextOpen });
    dispatch('openchange', { open: nextOpen });
    if (!nextOpen && restoreFocus) {
      void tick().then(() => {
        triggerEl?.focus();
      });
    }
  }

  function closeMenu(restoreFocus = true): void {
    setOpen(false, restoreFocus);
  }

  function chooseItem(item: MenuItem): void {
    if (item.disabled) return;
    currentValue = item.value;
    onAction?.({ value: item.value });
    dispatch('action', { value: item.value });
    closeMenu();
  }

  function handleWindowClick(event: MouseEvent): void {
    if (!internalOpen) {
      return;
    }
    if (isEventOutside(surfaceEl, event.target) && isEventOutside(triggerEl, event.target)) {
      closeMenu(Boolean(surfaceEl?.contains(document.activeElement)));
    }
  }

  function handleWindowFocus(event: FocusEvent): void {
    if (internalOpen && isEventOutside(surfaceEl, event.target) && isEventOutside(triggerEl, event.target)) {
      closeMenu(false);
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

    if (isEventOutside(surfaceEl, event.target) && isEventOutside(triggerEl, event.target)) return;

    const nextIndex = nextListIndex(items, highlightIndex, event.key, { orientation: 'vertical' });
    if (nextIndex !== highlightIndex) {
      highlightIndex = nextIndex;
      itemRefs[nextIndex]?.focus();
      event.preventDefault();
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && items[highlightIndex] && !items[highlightIndex].disabled) {
      chooseItem(items[highlightIndex]);
      event.preventDefault();
    }
  }
</script>

<svelte:window onclick={handleWindowClick} onfocusin={handleWindowFocus} onkeydown={handleKeydown} />

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
    style={`${slotStyles.surface}; --dk-viewport-inline-size:${viewportInlineSize}; left:${position.left}px; top:${position.top}px;`}
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
        onfocus={() => { highlightIndex = index; }}
        onclick={() => chooseItem(item)}
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
    min-block-size: 44px;
    min-inline-size: 44px;
    padding: 0 .75rem;
  }

  .menu-surface {
    box-sizing: border-box;
    max-inline-size: calc(var(--dk-viewport-inline-size, 100vw) - 2rem);
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
