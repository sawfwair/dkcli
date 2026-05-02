<script lang="ts">
  import type { ThemeContract } from '@dkcli/core';

  import {
    DEFAULT_CARD_THEME,
    createCardRegistration,
    getCardRecipeCase,
    serializeCardSlotStyles
  } from './card.recipe.js';
  import type { CardPadding, CardSurface } from './card.spec.js';

  export let padding: CardPadding = 'md';
  export let surface: CardSurface = 'default';
  export let theme: ThemeContract = DEFAULT_CARD_THEME;

  const defaultRegistration = createCardRegistration(DEFAULT_CARD_THEME);

  let registration = defaultRegistration;
  let compiledCase = getCardRecipeCase(defaultRegistration.recipe, { padding, surface });
  let slotStyles = serializeCardSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_CARD_THEME.name ? defaultRegistration : createCardRegistration(theme);
  $: compiledCase = getCardRecipeCase(registration.recipe, { padding, surface });
  $: slotStyles = serializeCardSlotStyles(compiledCase);
</script>

<article class="dk-card" style={slotStyles.root} data-padding={padding} data-surface={surface}>
  {#if $$slots.media}
    <div class="card-media" style={slotStyles.media}>
      <slot name="media" />
    </div>
  {/if}

  {#if $$slots.header}
    <header class="card-header" style={slotStyles.header}>
      <slot name="header" />
    </header>
  {/if}

  <div class="card-body" style={slotStyles.body}>
    <slot />
  </div>

  {#if $$slots.footer}
    <footer class="card-footer" style={slotStyles.footer}>
      <slot name="footer" />
    </footer>
  {/if}
</article>

<style>
  .dk-card {
    background: var(--dk-card-bg);
    border: 1px solid var(--dk-card-border);
    border-radius: var(--dk-card-radius);
    box-shadow: var(--dk-card-shadow);
    color: var(--dk-card-fg);
    display: grid;
    gap: var(--dk-card-padding);
    padding: var(--dk-card-padding);
  }

  .card-media {
    border-radius: var(--dk-card-media-radius);
    min-block-size: var(--dk-card-media-min-height);
    overflow: hidden;
  }

  .card-header {
    display: grid;
    gap: var(--dk-card-header-gap);
  }

  .card-body {
    font-size: var(--dk-card-body-size);
    line-height: var(--dk-card-body-line-height);
  }

  .card-footer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dk-card-footer-gap);
  }
</style>
