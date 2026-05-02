<script lang="ts">
  import type { ThemeContract } from '@dkcli/core';

  import {
    DEFAULT_EMPTY_STATE_THEME,
    createEmptyStateRegistration,
    getEmptyStateRecipeCase,
    serializeEmptyStateSlotStyles
  } from './empty-state.recipe.js';
  import type { EmptyStateSize, EmptyStateTone } from './empty-state.spec.js';

  export let title = 'Nothing here yet';
  export let description = 'When there is data to show, it will appear here.';
  export let tone: EmptyStateTone = 'neutral';
  export let size: EmptyStateSize = 'md';
  export let theme: ThemeContract = DEFAULT_EMPTY_STATE_THEME;

  const defaultRegistration = createEmptyStateRegistration(DEFAULT_EMPTY_STATE_THEME);

  let registration = defaultRegistration;
  let compiledCase = getEmptyStateRecipeCase(defaultRegistration.recipe, { tone, size });
  let slotStyles = serializeEmptyStateSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_EMPTY_STATE_THEME.name ? defaultRegistration : createEmptyStateRegistration(theme);
  $: compiledCase = getEmptyStateRecipeCase(registration.recipe, { tone, size });
  $: slotStyles = serializeEmptyStateSlotStyles(compiledCase);
</script>

<section class="dk-empty-state" style={slotStyles.root} data-tone={tone}>
  {#if $$slots.icon}
    <div class="empty-icon" style={slotStyles.icon}>
      <slot name="icon" />
    </div>
  {/if}

  <div class="empty-copy">
    <h2 class="empty-title" style={slotStyles.title}>{title}</h2>
    <p class="empty-description" style={slotStyles.description}>{description}</p>
  </div>

  {#if $$slots.actions}
    <div class="empty-actions" style={slotStyles.actions}>
      <slot name="actions" />
    </div>
  {/if}
</section>

<style>
  .dk-empty-state {
    background: var(--dk-empty-bg);
    border: 1px solid var(--dk-empty-border);
    border-radius: var(--dk-empty-radius);
    color: var(--dk-empty-fg);
    display: grid;
    gap: var(--dk-empty-gap);
    justify-items: start;
    padding: var(--dk-empty-padding);
  }

  .empty-icon {
    align-items: center;
    background: var(--dk-empty-icon-shell-bg);
    border-radius: 999px;
    color: var(--dk-empty-icon-color);
    display: inline-flex;
    font-size: var(--dk-empty-icon-size);
    justify-content: center;
    min-block-size: calc(var(--dk-empty-icon-size) + 1.25rem);
    min-inline-size: calc(var(--dk-empty-icon-size) + 1.25rem);
  }

  .empty-copy {
    display: grid;
    gap: 0.4rem;
  }

  .empty-title,
  .empty-description {
    margin: 0;
  }

  .empty-title {
    color: var(--dk-empty-title-color);
    font-size: var(--dk-empty-title-size);
    font-weight: var(--dk-empty-title-weight);
    line-height: 1.2;
  }

  .empty-description {
    color: var(--dk-empty-description-color);
    font-size: var(--dk-empty-description-size);
    line-height: 1.6;
    max-inline-size: 42ch;
  }

  .empty-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dk-empty-actions-gap);
  }
</style>
