<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import { computeAnchoredPosition, getFocusableElements, isEventOutside, trapFocus, type Placement } from '../internal/behavior/index.js';
  import {
    DEFAULT_POPOVER_THEME,
    createPopoverRegistration,
    getPopoverRecipeCase,
    serializePopoverSlotStyles
  } from './popover.recipe.js';
  import type { PopoverSize } from './popover.spec.js';

  const dispatch = createEventDispatcher<{ openchange: { open: boolean } }>();

  export let open = false;
  export let placement: Placement = 'bottom';
  export let offset = 12;
  export let closeOnEscape = true;
  export let closeOnOutsidePress = true;
  export let size: PopoverSize = 'md';
  export let theme: ThemeContract = DEFAULT_POPOVER_THEME;
  export let onOpenChange: ((detail: { open: boolean }) => void) | undefined = undefined;

  const defaultRegistration = createPopoverRegistration(DEFAULT_POPOVER_THEME);

  let registration = defaultRegistration;
  let internalOpen = open;
  let previousOpen = open;
  let triggerEl: HTMLElement | null = null;
  let surfaceEl: HTMLElement | null = null;
  let position = { left: 0, top: 0, placement };
  let compiledCase = getPopoverRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializePopoverSlotStyles(compiledCase);

  $: registration =
    theme.name === DEFAULT_POPOVER_THEME.name ? defaultRegistration : createPopoverRegistration(theme);
  $: if (open !== previousOpen) {
    internalOpen = open;
    previousOpen = open;
  }
  $: compiledCase = getPopoverRecipeCase(registration.recipe, { size });
  $: slotStyles = serializePopoverSlotStyles(compiledCase);
  $: if (internalOpen) {
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
      surface: { width: surface.width || 260, height: surface.height || 220 },
      placement,
      offset,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    });
    getFocusableElements(surfaceEl)[0]?.focus();
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

  function handleWindowClick(event: MouseEvent): void {
    if (!internalOpen || !closeOnOutsidePress) {
      return;
    }
    const outsideSurface = isEventOutside(surfaceEl, event.target);
    const outsideTrigger = isEventOutside(triggerEl, event.target);
    if (outsideSurface && outsideTrigger) {
      setOpen(false);
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!internalOpen) {
      return;
    }
    if (closeOnEscape && event.key === 'Escape') {
      setOpen(false);
      return;
    }
    trapFocus(event, surfaceEl);
  }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<button
  bind:this={triggerEl}
  type="button"
  class="popover-trigger"
  aria-haspopup="dialog"
  aria-expanded={internalOpen ? 'true' : 'false'}
  onclick={() => {
    setOpen(!internalOpen);
  }}
>
  <slot name="trigger">Open popover</slot>
</button>

{#if internalOpen}
  <section
    bind:this={surfaceEl}
    class="popover-surface"
    style={`${slotStyles.surface}; left:${position.left}px; top:${position.top}px;`}
    tabindex="-1"
    role="dialog"
  >
    <div class="popover-content" style={slotStyles.content}>
      <slot />
    </div>
  </section>
{/if}

<style>
  .popover-trigger {
    background: transparent;
    border: 0;
    padding: 0;
  }

  .popover-surface {
    background: var(--dk-popover-surface-bg);
    border: 1px solid var(--dk-popover-surface-border);
    border-radius: var(--dk-popover-surface-radius);
    box-shadow: var(--dk-popover-surface-shadow);
    color: var(--dk-popover-surface-fg);
    inline-size: min(var(--dk-popover-surface-width), calc(100vw - 2rem));
    padding: var(--dk-popover-surface-padding);
    position: fixed;
    z-index: 40;
  }

  .popover-content {
    font-size: var(--dk-popover-content-size);
    line-height: 1.5;
  }
</style>
