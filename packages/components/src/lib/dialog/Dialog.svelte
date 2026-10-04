<script lang="ts">
  import { run } from 'svelte/legacy';
  import { createEventDispatcher, tick, untrack } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import { getFocusableElements, trapFocus } from '../internal/behavior/index.js';
  import {
    DEFAULT_DIALOG_THEME,
    createDialogRegistration,
    getDialogRecipeCase,
    serializeDialogSlotStyles
  } from './dialog.recipe.js';
  import type { DialogSize } from './dialog.spec.js';

  const uid = $props.id();

  const dispatch = createEventDispatcher<{ openchange: { open: boolean } }>();

  interface Props {
    open?: boolean;
    size?: DialogSize;
    title?: string;
    description?: string | undefined;
    closeOnEscape?: boolean;
    closeOnOutsidePress?: boolean;
    theme?: ThemeContract;
    onOpenChange?: ((detail: { open: boolean }) => void) | undefined;
  }

  let {
    open = $bindable(false),
    size = $bindable('md'),
    title = $bindable('Dialog'),
    description = $bindable(undefined),
    closeOnEscape = $bindable(true),
    closeOnOutsidePress = $bindable(true),
    theme = $bindable(DEFAULT_DIALOG_THEME),
    onOpenChange = $bindable(undefined)
  }: Props = $props();

  const defaultRegistration = createDialogRegistration(DEFAULT_DIALOG_THEME);
  const localId = `dk-dialog-${uid}`;

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
  let registration = $derived(theme.name === DEFAULT_DIALOG_THEME.name ? defaultRegistration : createDialogRegistration(theme));
  run(() => {
    if (open !== previousOpen) {
      internalOpen = open;
      previousOpen = open;
    }
  });
  let compiledCase = $derived(getDialogRecipeCase(registration.recipe, { size }));
  let slotStyles = $derived(serializeDialogSlotStyles(compiledCase));
  run(() => {
    if (internalOpen) {
      void focusSurface();
    }
  });
</script>

<div class="dk-dialog-trigger">
  <button
    bind:this={triggerEl}
    type="button"
    class="dialog-trigger-button"
    aria-haspopup="dialog"
    aria-expanded={internalOpen ? 'true' : 'false'}
    aria-controls={`${localId}-surface`}
    onclick={() => {
      setOpen(true);
    }}
  >
    <!-- svelte-ignore slot_element_deprecated (Preserve the legacy named-slot API.) -->
    <slot name="trigger">Open dialog</slot>
  </button>
</div>

{#if internalOpen}
  <div
    class="dialog-backdrop"
    style={slotStyles.backdrop}
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="presentation"
    tabindex="-1"
  >
    <div
      class="dialog-surface"
      id={`${localId}-surface`}
      style={slotStyles.surface}
      bind:this={surfaceEl}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${localId}-title`}
      aria-describedby={description ? `${localId}-description` : undefined}
      tabindex="-1"
      onkeydown={handleKeydown}
    >
      <div class="dialog-header">
        <div>
          <h2 id={`${localId}-title`} class="dialog-title" style={slotStyles.title}>{title}</h2>
          {#if description}
            <p id={`${localId}-description`} class="dialog-description" style={slotStyles.description}>{description}</p>
          {/if}
        </div>
        <button class="dialog-close" type="button" onclick={() => { setOpen(false); }}>Close</button>
      </div>

      <div class="dialog-body">
        <!-- svelte-ignore slot_element_deprecated (Preserve the legacy slot API.) -->
        <slot />
      </div>

      {#if $$slots.footer}
        <div class="dialog-footer" style={slotStyles.footer}>
          <!-- svelte-ignore slot_element_deprecated (Preserve the legacy named-slot API.) -->
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .dialog-trigger-button {
    box-sizing: border-box;
    max-inline-size: 100%;
    overflow-wrap: anywhere;
    background: transparent;
    border: 0;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding: 0 .75rem;
  }

  .dialog-backdrop {
    box-sizing: border-box;
    align-items: center;
    background: var(--dk-dialog-backdrop-bg);
    inset: 0;
    display: flex;
    justify-content: center;
    padding: 1.5rem;
    position: fixed;
    z-index: 50;
  }

  .dialog-surface {
    box-sizing: border-box;
    min-inline-size: 0;
    max-inline-size: 100%;
    overflow-wrap: anywhere;
    background: var(--dk-dialog-surface-bg);
    border: 1px solid var(--dk-dialog-surface-border);
    border-radius: var(--dk-dialog-surface-radius);
    box-shadow: var(--dk-dialog-surface-shadow);
    color: var(--dk-dialog-surface-fg);
    inline-size: min(var(--dk-dialog-surface-width), calc(100vw - 3rem));
    max-block-size: 100%;
    overflow: auto;
    padding: var(--dk-dialog-surface-padding);
    padding-inline: min(var(--dk-dialog-surface-padding), max(0.25rem, calc(20% - 1rem)));
  }

  .dialog-header {
    align-items: start;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .dialog-header > div {
    min-inline-size: 0;
  }

  .dialog-title,
  .dialog-description {
    margin: 0;
  }

  .dialog-title {
    font-size: var(--dk-dialog-title-size);
    font-weight: var(--dk-dialog-title-weight);
  }

  .dialog-description {
    font-size: var(--dk-dialog-description-size);
    line-height: 1.5;
    margin-top: 0.4rem;
  }

  .dialog-body {
    line-height: 1.55;
  }

  .dialog-footer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dk-dialog-footer-gap);
    justify-content: flex-end;
    margin-top: 1.25rem;
  }

  .dialog-close {
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
