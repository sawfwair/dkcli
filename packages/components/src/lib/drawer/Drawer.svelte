<script lang="ts">
  import { run } from 'svelte/legacy';
  import { createEventDispatcher, tick, untrack } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import { getFocusableElements, trapFocus } from '../internal/behavior/index.js';
  import {
    DEFAULT_DRAWER_THEME,
    createDrawerRegistration,
    getDrawerRecipeCase,
    serializeDrawerSlotStyles
  } from './drawer.recipe.js';
  import type { DrawerSide, DrawerSize } from './drawer.spec.js';

  const uid = $props.id();

  const dispatch = createEventDispatcher<{ openchange: { open: boolean } }>();

  interface Props {
    open?: boolean;
    side?: DrawerSide;
    size?: DrawerSize;
    title?: string;
    description?: string | undefined;
    closeOnEscape?: boolean;
    closeOnOutsidePress?: boolean;
    theme?: ThemeContract;
    onOpenChange?: ((detail: { open: boolean }) => void) | undefined;
  }

  let {
    open = $bindable(false),
    side = $bindable('right'),
    size = $bindable('md'),
    title = $bindable('Drawer'),
    description = $bindable(undefined),
    closeOnEscape = $bindable(true),
    closeOnOutsidePress = $bindable(true),
    theme = $bindable(DEFAULT_DRAWER_THEME),
    onOpenChange = $bindable(undefined)
  }: Props = $props();

  const defaultRegistration = createDrawerRegistration(DEFAULT_DRAWER_THEME);
  const localId = `dk-drawer-${uid}`;

  let internalOpen = $state(untrack(() => open));
  let previousOpen = $state(untrack(() => open));
  let triggerEl: HTMLButtonElement | null = $state(null);
  let surfaceEl: HTMLElement | null = $state(null);

  async function focusSurface(): Promise<void> {
    await tick();
    const focusable = getFocusableElements(surfaceEl);
    if (focusable[0]) {
      focusable[0].focus();
    } else {
      surfaceEl?.focus();
    }
  }

  async function returnFocus(): Promise<void> {
    await tick();
    triggerEl?.focus();
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
      void returnFocus();
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

  function handleBackdropClick(event: MouseEvent): void {
    if (closeOnOutsidePress && event.target === event.currentTarget) {
      setOpen(false);
    }
  }
  let registration = $derived(theme.name === DEFAULT_DRAWER_THEME.name ? defaultRegistration : createDrawerRegistration(theme));
  run(() => {
    if (open !== previousOpen) {
      internalOpen = open;
      previousOpen = open;
    }
  });
  let compiledCase = $derived(getDrawerRecipeCase(registration.recipe, { size, side }));
  let slotStyles = $derived(serializeDrawerSlotStyles(compiledCase));
  run(() => {
    if (internalOpen) {
      void focusSurface();
    }
  });
</script>

<div class="dk-drawer-trigger">
  <button
    bind:this={triggerEl}
    type="button"
    class="drawer-trigger-button"
    aria-haspopup="dialog"
    aria-expanded={internalOpen ? 'true' : 'false'}
    aria-controls={`${localId}-surface`}
    onclick={() => {
      setOpen(true);
    }}
  >
    <!-- svelte-ignore slot_element_deprecated (Preserve the legacy named-slot API.) -->
    <slot name="trigger">Open drawer</slot>
  </button>
</div>

{#if internalOpen}
  <div
    class="drawer-backdrop"
    style={slotStyles.backdrop}
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="presentation"
    tabindex="-1"
  >
    <div
      class="drawer-surface"
      id={`${localId}-surface`}
      data-side={side}
      style={slotStyles.surface}
      bind:this={surfaceEl}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${localId}-title`}
      aria-describedby={description ? `${localId}-description` : undefined}
      tabindex="-1"
      onkeydown={handleKeydown}
    >
      <div class="drawer-header">
        <div>
          <h2 id={`${localId}-title`} class="drawer-title" style={slotStyles.title}>{title}</h2>
          {#if description}
            <p id={`${localId}-description`} class="drawer-description" style={slotStyles.description}>
              {description}
            </p>
          {/if}
        </div>
        <button class="drawer-close" type="button" onclick={() => { setOpen(false); }}>Close</button>
      </div>

      <div class="drawer-body">
        <!-- svelte-ignore slot_element_deprecated (Preserve the legacy slot API.) -->
        <slot />
      </div>

      {#if $$slots.footer}
        <div class="drawer-footer" style={slotStyles.footer}>
          <!-- svelte-ignore slot_element_deprecated (Preserve the legacy named-slot API.) -->
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .drawer-trigger-button {
    background: transparent;
    border: 0;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding: 0 .75rem;
  }

  .drawer-backdrop {
    background: var(--dk-drawer-backdrop-bg);
    inset: 0;
    position: fixed;
    z-index: 52;
  }

  .drawer-surface {
    box-sizing: border-box;
    min-inline-size: 0;
    max-inline-size: 100%;
    overflow-wrap: anywhere;
    background: var(--dk-drawer-surface-bg);
    border-left: 1px solid var(--dk-drawer-surface-border);
    border-radius: 0;
    box-shadow: var(--dk-drawer-surface-shadow);
    color: var(--dk-drawer-surface-fg);
    inline-size: min(var(--dk-drawer-surface-width), calc(100vw - 1.5rem));
    inset: 0 0 0 auto;
    max-block-size: 100vh;
    overflow: auto;
    padding: var(--dk-drawer-surface-padding);
    position: absolute;
  }

  .drawer-surface[data-side='left'] {
    border-left: 0;
    border-right: 1px solid var(--dk-drawer-surface-border);
    inset: 0 auto 0 0;
  }

  .drawer-header {
    align-items: start;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .drawer-title,
  .drawer-description {
    margin: 0;
  }

  .drawer-header > div {
    min-inline-size: 0;
  }

  .drawer-title {
    font-size: var(--dk-drawer-title-size);
    font-weight: var(--dk-drawer-title-weight);
  }

  .drawer-description {
    font-size: var(--dk-drawer-description-size);
    line-height: 1.5;
    margin-top: 0.4rem;
  }

  .drawer-body {
    line-height: 1.6;
  }

  .drawer-footer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dk-drawer-footer-gap);
    justify-content: flex-end;
    margin-top: 1.25rem;
  }

  .drawer-close {
    flex-shrink: 0;
    font: inherit;
    min-block-size: 44px;
    min-inline-size: 44px;
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
  }
</style>
