<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import {
    DEFAULT_ALERT_THEME,
    createAlertRegistration,
    getAlertRecipeCase,
    serializeAlertSlotStyles
  } from './alert.recipe.js';
  import type { AlertTone } from './alert.spec.js';

  const dispatch = createEventDispatcher<{ dismiss: void }>();

  export let tone: AlertTone = 'neutral';
  export let title: string | undefined = undefined;
  export let description: string | undefined = undefined;
  export let dismissible = false;
  export let theme: ThemeContract = DEFAULT_ALERT_THEME;
  export let onDismiss: (() => void) | undefined = undefined;

  const defaultRegistration = createAlertRegistration(DEFAULT_ALERT_THEME);

  let registration = defaultRegistration;
  let dismissed = false;
  let compiledCase = getAlertRecipeCase(defaultRegistration.recipe, { tone });
  let slotStyles = serializeAlertSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_ALERT_THEME.name ? defaultRegistration : createAlertRegistration(theme);
  $: compiledCase = getAlertRecipeCase(registration.recipe, { tone });
  $: slotStyles = serializeAlertSlotStyles(compiledCase);
  $: if (!dismissible) {
    dismissed = false;
  }

  function handleDismiss(): void {
    dismissed = true;
    onDismiss?.();
    dispatch('dismiss');
  }
</script>

{#if !dismissed}
  <div class="dk-alert" style={slotStyles.root} data-tone={tone} role="status">
    {#if $$slots.icon}
      <div class="alert-icon" style={slotStyles.icon}>
        <slot name="icon" />
      </div>
    {/if}

    <div class="alert-copy">
      {#if title}
        <h3 class="alert-title" style={slotStyles.title}>{title}</h3>
      {/if}

      {#if description}
        <p class="alert-description" style={slotStyles.description}>{description}</p>
      {/if}

      {#if $$slots.actions}
        <div class="alert-actions" style={slotStyles.actions}>
          <slot name="actions" />
        </div>
      {/if}
    </div>

    {#if dismissible}
      <button
        class="alert-dismiss"
        style={slotStyles.dismiss}
        type="button"
        aria-label="Dismiss alert"
        onclick={handleDismiss}
      >
        ×
      </button>
    {/if}
  </div>
{/if}

<style>
  .dk-alert {
    align-items: start;
    background: var(--dk-alert-bg);
    border: var(--dk-alert-border-width) solid var(--dk-alert-border);
    border-radius: var(--dk-alert-radius);
    color: var(--dk-alert-fg);
    display: grid;
    gap: var(--dk-alert-gap);
    grid-template-columns: auto minmax(0, 1fr) auto;
    padding: var(--dk-alert-padding);
  }

  .alert-icon {
    align-items: center;
    display: inline-flex;
    font-size: var(--dk-alert-icon-size);
    justify-content: center;
    line-height: 1;
    margin-top: 0.1rem;
  }

  .alert-copy {
    display: grid;
    gap: 0.35rem;
  }

  .alert-title,
  .alert-description {
    margin: 0;
  }

  .alert-title {
    color: var(--dk-alert-title-color);
    font-size: var(--dk-alert-title-size);
    font-weight: var(--dk-alert-title-weight);
    line-height: 1.25;
  }

  .alert-description {
    color: var(--dk-alert-description-color);
    font-size: var(--dk-alert-description-size);
    line-height: 1.5;
  }

  .alert-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dk-alert-actions-gap);
    margin-top: 0.35rem;
  }

  .alert-dismiss {
    align-items: center;
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    font-size: 1.2rem;
    inline-size: var(--dk-alert-dismiss-size);
    justify-content: center;
    min-block-size: var(--dk-alert-dismiss-size);
    padding: 0;
  }
</style>
