<script lang="ts">
  import { run } from 'svelte/legacy';
  import { createEventDispatcher, tick, untrack } from 'svelte';
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

  const uid = $props.id();

  const dispatch = createEventDispatcher<{ openchange: { open: boolean } }>();

  interface Props {
    content?: string;
    open?: boolean;
    placement?: Placement;
    delayMs?: number;
    disabled?: boolean;
    theme?: ThemeContract;
    onOpenChange?: ((detail: { open: boolean }) => void) | undefined;
  }

  let {
    content = $bindable(''),
    open = $bindable(false),
    placement = $bindable('top'),
    delayMs = $bindable(300),
    disabled = $bindable(false),
    theme = $bindable(DEFAULT_TOOLTIP_THEME),
    onOpenChange = $bindable(undefined)
  }: Props = $props();

  const defaultRegistration = createTooltipRegistration(DEFAULT_TOOLTIP_THEME);
  const tooltipId = `dk-tooltip-${uid}`;

  let internalOpen = $state(untrack(() => open));
  let previousOpen = $state(untrack(() => open));
  let triggerEl: HTMLElement | null = $state(null);
  let surfaceEl: HTMLElement | null = $state(null);
  let openTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
  let viewportInlineSize = $state('100vw');
  let position = $state({ left: 0, top: 0 });

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
    const rootZoom = Number.parseFloat(getComputedStyle(document.documentElement).zoom);
    const coordinateScale = Number.isFinite(rootZoom) && rootZoom > 0 ? rootZoom : 1;
    viewportInlineSize = `${window.innerWidth / coordinateScale}px`;
    await tick();
    if (!internalOpen || !triggerEl || !surfaceEl) return;
    const anchor = triggerEl.getBoundingClientRect();
    const surface = surfaceEl.getBoundingClientRect();
    const next = computeAnchoredPosition({
      anchor,
      surface: { width: surface.width || 240, height: surface.height || 72 },
      placement,
      offset: 8,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      coordinateScale
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

  let registration = $derived(theme.name === DEFAULT_TOOLTIP_THEME.name ? defaultRegistration : createTooltipRegistration(theme));
  run(() => {
    if (open !== previousOpen) {
      internalOpen = open;
      previousOpen = open;
    }
  });
  let compiledCase = $derived(getTooltipRecipeCase(registration.recipe));
  let slotStyles = $derived(serializeTooltipSlotStyles(compiledCase));
  run(() => {
    if (internalOpen) {
      void syncPosition();
    }
  });
  run(() => {
    if (disabled && internalOpen) {
      closeTooltip();
    }
  });
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
  <!-- svelte-ignore slot_element_deprecated (Preserve the legacy slot API.) -->
    <slot>Details</slot>
</span>

{#if internalOpen}
  <div
    bind:this={surfaceEl}
    use:portal
    class="tooltip-surface"
    id={tooltipId}
    style={`${slotStyles.surface}; --dk-viewport-inline-size:${viewportInlineSize}; left:${position.left}px; top:${position.top}px;`}
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
    box-sizing: border-box;
    max-inline-size: calc(var(--dk-viewport-inline-size, 100vw) - 2rem);
    background: var(--dk-tooltip-surface-bg);
    border: 1px solid var(--dk-tooltip-surface-border);
    border-radius: var(--dk-tooltip-surface-radius);
    box-shadow: var(--dk-tooltip-surface-shadow);
    color: var(--dk-tooltip-surface-fg);
    inline-size: min(var(--dk-tooltip-surface-max-width), calc(var(--dk-viewport-inline-size, 100vw) - 2rem));
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
