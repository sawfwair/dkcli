<script context="module" lang="ts">
  export type ToastTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

  export type ToastItem = {
    id: string;
    tone: ToastTone;
    title: string;
    description?: string;
    actionLabel?: string;
    actionHref?: string;
  };
</script>

<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { resolveTokenExpr, type ThemeContract } from '@dkcli/core';

  import { portal } from '../internal/behavior/index.js';
  import { sanitizeHref } from '../shared/url.js';
  import {
    DEFAULT_TOAST_THEME,
    createToastRegistration,
    getToastRecipeCase,
    serializeToastSlotStyles
  } from './toast.recipe.js';
  import type { ToastPlacement } from './toast.spec.js';

  const dispatch = createEventDispatcher<{ dismiss: { id: string }; action: { id: string } }>();

  export let items: ToastItem[] = [];
  export let placement: ToastPlacement = 'bottom-right';
  export let durationMs = 5000;
  export let dismissible = true;
  export let theme: ThemeContract = DEFAULT_TOAST_THEME;
  export let onDismiss: ((detail: { id: string }) => void) | undefined = undefined;
  export let onAction: ((detail: { id: string }) => void) | undefined = undefined;

  const defaultRegistration = createToastRegistration(DEFAULT_TOAST_THEME);

  let registration = defaultRegistration;
  let dismissedIds = new Set<string>();
  let timers = new Map<string, ReturnType<typeof setTimeout>>();
  let compiledCase = getToastRecipeCase(defaultRegistration.recipe, { placement });
  let slotStyles = serializeToastSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_TOAST_THEME.name ? defaultRegistration : createToastRegistration(theme);
  $: compiledCase = getToastRecipeCase(registration.recipe, { placement });
  $: slotStyles = serializeToastSlotStyles(compiledCase);
  $: visibleItems = items.filter((item) => !dismissedIds.has(item.id));
  $: syncTimers(visibleItems, durationMs);

  onDestroy(() => {
    for (const handle of timers.values()) {
      clearTimeout(handle);
    }
  });

  function syncTimers(nextItems: ToastItem[], duration: number): void {
    if (typeof window === 'undefined') {
      return;
    }
    for (const handle of timers.values()) {
      clearTimeout(handle);
    }
    timers.clear();
    for (const item of nextItems) {
      timers.set(
        item.id,
        setTimeout(() => {
          dismissItem(item.id);
        }, duration)
      );
    }
  }

  function dismissItem(id: string): void {
    dismissedIds = new Set([...dismissedIds, id]);
    onDismiss?.({ id });
    dispatch('dismiss', { id });
  }

  function handleAction(id: string): void {
    onAction?.({ id });
    dispatch('action', { id });
  }

  function toneStyles(tone: ToastTone): string {
    const neutralFg = String(resolveTokenExpr(theme, { ref: 'color.on-surface' }));
    const neutralBg = String(resolveTokenExpr(theme, { ref: 'color.surface-bright' }));

    if (tone === 'brand') {
      return [
        `--dk-toast-item-bg: ${resolveTokenExpr(theme, { alias: 'status-brand-bg' })};`,
        `--dk-toast-item-fg: ${resolveTokenExpr(theme, { alias: 'status-brand-fg' })};`,
        `--dk-toast-item-border: ${resolveTokenExpr(theme, { alias: 'status-brand-border' })};`
      ].join(' ');
    }

    if (tone === 'success' || tone === 'warning' || tone === 'danger') {
      return [
        `--dk-toast-item-bg: ${neutralBg};`,
        `--dk-toast-item-fg: ${neutralFg};`,
        `--dk-toast-item-border: ${resolveTokenExpr(theme, { alias: `status-${tone}-border` })};`
      ].join(' ');
    }

    return [
      `--dk-toast-item-bg: ${neutralBg};`,
      `--dk-toast-item-fg: ${neutralFg};`,
      `--dk-toast-item-border: ${resolveTokenExpr(theme, { alias: 'status-neutral-border' })};`
    ].join(' ');
  }
</script>

{#if visibleItems.length > 0}
  <div class="dk-toast-stack" style={slotStyles.root} data-placement={placement} use:portal>
    {#each visibleItems as item (item.id)}
      {@const safeActionHref = sanitizeHref(item.actionHref)}
      <article class="toast-item" style={`${slotStyles.item} ${toneStyles(item.tone)}`} role="status">
        <div class="toast-copy">
          <h3 class="toast-title" style={slotStyles.title}>{item.title}</h3>
          {#if item.description}
            <p class="toast-description" style={slotStyles.description}>{item.description}</p>
          {/if}

          {#if item.actionLabel}
            {#if safeActionHref}
              <a class="toast-action" style={slotStyles.action} href={safeActionHref} onclick={() => handleAction(item.id)}>
                {item.actionLabel}
              </a>
            {:else}
              <button class="toast-action" style={slotStyles.action} type="button" onclick={() => handleAction(item.id)}>
                {item.actionLabel}
              </button>
            {/if}
          {/if}
        </div>

        {#if dismissible}
          <button
            class="toast-dismiss"
            style={slotStyles.dismiss}
            type="button"
            aria-label={`Dismiss ${item.title}`}
            onclick={() => dismissItem(item.id)}
          >
            ×
          </button>
        {/if}
      </article>
    {/each}
  </div>
{/if}

<style>
  .dk-toast-stack {
    display: grid;
    gap: var(--dk-toast-stack-gap);
    inset: auto var(--dk-toast-stack-inset) var(--dk-toast-stack-inset) auto;
    position: fixed;
    z-index: 70;
  }

  .dk-toast-stack[data-placement='bottom-left'] {
    inset: auto auto var(--dk-toast-stack-inset) var(--dk-toast-stack-inset);
  }

  .dk-toast-stack[data-placement='top-right'] {
    inset: var(--dk-toast-stack-inset) var(--dk-toast-stack-inset) auto auto;
  }

  .dk-toast-stack[data-placement='top-left'] {
    inset: var(--dk-toast-stack-inset) auto auto var(--dk-toast-stack-inset);
  }

  .toast-item {
    align-items: start;
    background: var(--dk-toast-item-bg);
    border: 1px solid var(--dk-toast-item-border);
    border-radius: var(--dk-toast-item-radius);
    box-shadow: var(--dk-toast-item-shadow);
    color: var(--dk-toast-item-fg);
    display: grid;
    gap: 0.75rem;
    grid-template-columns: minmax(0, 1fr) auto;
    inline-size: min(var(--dk-toast-item-max-width), calc(100vw - 2rem));
    padding: var(--dk-toast-item-padding);
  }

  .toast-copy {
    display: grid;
    gap: 0.35rem;
  }

  .toast-title,
  .toast-description {
    margin: 0;
  }

  .toast-title {
    font-size: var(--dk-toast-title-size);
    font-weight: var(--dk-toast-title-weight);
    line-height: 1.3;
  }

  .toast-description {
    font-size: var(--dk-toast-description-size);
    line-height: 1.5;
  }

  .toast-action {
    align-items: center;
    background: var(--dk-toast-action-bg);
    border: 0;
    border-radius: var(--dk-toast-action-radius);
    color: var(--dk-toast-action-fg);
    display: inline-flex;
    font-size: var(--dk-toast-action-size);
    inline-size: fit-content;
    justify-content: center;
    margin-top: 0.3rem;
    min-block-size: var(--dk-toast-action-block-size);
    padding-inline: var(--dk-toast-action-inline-padding);
    text-decoration: none;
  }

  .toast-dismiss {
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
    font-size: 1.25rem;
    inline-size: var(--dk-toast-dismiss-size);
    min-block-size: var(--dk-toast-dismiss-size);
    padding: 0;
  }
</style>
