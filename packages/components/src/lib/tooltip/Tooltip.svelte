<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import {
    computeAnchoredPosition,
    portal,
    shouldDismissLayer,
    type Placement
  } from '../internal/behavior/index.js';
  import {
    DEFAULT_TOOLTIP_THEME,
    createTooltipRegistration,
    getTooltipRecipeCase,
    serializeTooltipSlotStyles
  } from './tooltip.recipe.js';

  let nextId = 0;
  const dispatch = createEventDispatcher<{ openchange: { open: boolean } }>();

  export let content = '';
  export let open = false;
  export let placement: Placement = 'top';
  export let delayMs = 300;
  export let disabled = false;
  export let theme: ThemeContract = DEFAULT_TOOLTIP_THEME;
  export let onOpenChange: ((detail: { open: boolean }) => void) | undefined = undefined;

  const defaultRegistration = createTooltipRegistration(DEFAULT_TOOLTIP_THEME);
  const tooltipId = `dk-tooltip-${++nextId}`;

  let registration = defaultRegistration;
  let internalOpen = open;
  let previousOpen = open;
  let triggerEl: HTMLElement | null = null;
  let surfaceEl: HTMLElement | null = null;
  let openTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
  let position = { left: 0, top: 0 };
  let compiledCase = getTooltipRecipeCase(defaultRegistration.recipe);
  let slotStyles = serializeTooltipSlotStyles(compiledCase);

  $: registration =
    theme.name === DEFAULT_TOOLTIP_THEME.name ? defaultRegistration : createTooltipRegistration(theme);
  $: if (open !== previousOpen) {
    internalOpen = open;
    previousOpen = open;
  }
  $: compiledCase = getTooltipRecipeCase(registration.recipe);
  $: slotStyles = serializeTooltipSlotStyles(compiledCase);
  $: if (internalOpen) {
    void syncPosition();
  }
  $: if (disabled && internalOpen) {
    closeTooltip();
  }

  function clearOpenTimeout(): void {
    if (openTimeout) {
      clearTimeout(openTimeout);
      openTimeout = undefined;
    }
  }

  function scheduleOpen(): void {
    if (disabled) {
      return;
    }
    clearOpenTimeout();
    openTimeout = setTimeout(() => {
      setOpen(true);
    }, delayMs);
  }

  function closeTooltip(): void {
    clearOpenTimeout();
    setOpen(false);
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
    syncTriggerDescription();
    void tick().then(() => {
      syncTriggerDescription();
    });
  }

  function describedTargets(): HTMLElement[] {
    if (!triggerEl) {
      return [];
    }

    const descendants = Array.from(
      triggerEl.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );

    return descendants.length > 0 ? descendants : [triggerEl];
  }

  function syncTriggerDescription(): void {
    for (const target of describedTargets()) {
      const current = target.getAttribute('aria-describedby');
      const parts = current?.split(/\s+/).filter(Boolean) ?? [];
      const nextParts = internalOpen
        ? Array.from(new Set([...parts, tooltipId]))
        : parts.filter((part) => part !== tooltipId);

      if (nextParts.length > 0) {
        target.setAttribute('aria-describedby', nextParts.join(' '));
      } else {
        target.removeAttribute('aria-describedby');
      }
    }
  }

  async function syncPosition(): Promise<void> {
    await tick();
    if (!triggerEl || !surfaceEl || typeof window === 'undefined') {
      return;
    }
    const anchor = triggerEl.getBoundingClientRect();
    const surface = surfaceEl.getBoundingClientRect();
    const next = computeAnchoredPosition({
      anchor,
      surface: { width: surface.width || 240, height: surface.height || 72 },
      placement,
      offset: 8,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    });
    position = { left: next.left, top: next.top };
  }

  function handleWindowEvent(event: Event): void {
    if (!internalOpen) {
      return;
    }
    if (event instanceof KeyboardEvent && event.key === 'Escape') {
      closeTooltip();
      return;
    }
    if (
      shouldDismissLayer({
        event,
        root: surfaceEl,
        trigger: triggerEl
      })
    ) {
      closeTooltip();
    }
  }

</script>

<svelte:window onclick={handleWindowEvent} onkeydown={handleWindowEvent} onfocusin={handleWindowEvent} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<span
  bind:this={triggerEl}
  class="tooltip-trigger"
  role="group"
  onmouseover={scheduleOpen}
  onmouseout={closeTooltip}
  onfocus={scheduleOpen}
  onblur={closeTooltip}
  onfocusin={scheduleOpen}
  onfocusout={closeTooltip}
>
  <slot>Hover target</slot>
</span>

{#if internalOpen}
  <div
    bind:this={surfaceEl}
    use:portal
    class="tooltip-surface"
    id={tooltipId}
    style={`${slotStyles.surface}; left:${position.left}px; top:${position.top}px;`}
    role="tooltip"
  >
    <p class="tooltip-content" style={slotStyles.content}>{content}</p>
  </div>
{/if}

<style>
  .tooltip-trigger {
    display: inline-flex;
  }

  .tooltip-surface {
    background: var(--dk-tooltip-surface-bg);
    border: 1px solid var(--dk-tooltip-surface-border);
    border-radius: var(--dk-tooltip-surface-radius);
    box-shadow: var(--dk-tooltip-surface-shadow);
    color: var(--dk-tooltip-surface-fg);
    inline-size: min(var(--dk-tooltip-surface-max-width), calc(100vw - 2rem));
    padding: var(--dk-tooltip-surface-padding);
    pointer-events: none;
    position: fixed;
    z-index: 60;
  }

  .tooltip-content {
    font-size: var(--dk-tooltip-content-size);
    line-height: 1.45;
    margin: 0;
  }
</style>
