<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import { getFocusableElements, trapFocus } from '../internal/behavior/index.js';
  import {
    DEFAULT_DIALOG_THEME,
    createDialogRegistration,
    getDialogRecipeCase,
    serializeDialogSlotStyles
  } from './dialog.recipe.js';
  import type { DialogSize } from './dialog.spec.js';

  let nextId = 0;

  const dispatch = createEventDispatcher<{ openchange: { open: boolean } }>();

  export let open = false;
  export let size: DialogSize = 'md';
  export let title = 'Dialog';
  export let description: string | undefined = undefined;
  export let closeOnEscape = true;
  export let closeOnOutsidePress = true;
  export let theme: ThemeContract = DEFAULT_DIALOG_THEME;
  export let onOpenChange: ((detail: { open: boolean }) => void) | undefined = undefined;

  const defaultRegistration = createDialogRegistration(DEFAULT_DIALOG_THEME);
  const localId = `dk-dialog-${++nextId}`;

  let registration = defaultRegistration;
  let internalOpen = open;
  let previousOpen = open;
  let triggerEl: HTMLButtonElement | null = null;
  let surfaceEl: HTMLElement | null = null;
  let compiledCase = getDialogRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeDialogSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_DIALOG_THEME.name ? defaultRegistration : createDialogRegistration(theme);
  $: if (open !== previousOpen) {
    internalOpen = open;
    previousOpen = open;
  }
  $: compiledCase = getDialogRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeDialogSlotStyles(compiledCase);
  $: if (internalOpen) {
    void focusSurface();
  }

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
        <slot />
      </div>

      {#if $$slots.footer}
        <div class="dialog-footer" style={slotStyles.footer}>
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .dialog-trigger-button {
    background: transparent;
    border: 0;
    padding: 0;
  }

  .dialog-backdrop {
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
    background: var(--dk-dialog-surface-bg);
    border: 1px solid var(--dk-dialog-surface-border);
    border-radius: var(--dk-dialog-surface-radius);
    box-shadow: var(--dk-dialog-surface-shadow);
    color: var(--dk-dialog-surface-fg);
    inline-size: min(var(--dk-dialog-surface-width), calc(100vw - 3rem));
    max-block-size: calc(100vh - 3rem);
    overflow: auto;
    padding: var(--dk-dialog-surface-padding);
  }

  .dialog-header {
    align-items: start;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    margin-bottom: 1rem;
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
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
  }
</style>
