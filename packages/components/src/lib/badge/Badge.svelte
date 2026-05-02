<script lang="ts">
  import type { ThemeContract } from '@dkcli/core';

  import {
    DEFAULT_BADGE_THEME,
    createBadgeRegistration,
    getBadgeRecipeCase,
    serializeBadgeSlotStyles
  } from './badge.recipe.js';
  import type { BadgeEmphasis, BadgeSize, BadgeTone } from './badge.spec.js';

  export let tone: BadgeTone = 'neutral';
  export let emphasis: BadgeEmphasis = 'soft';
  export let size: BadgeSize = 'md';
  export let theme: ThemeContract = DEFAULT_BADGE_THEME;

  const defaultRegistration = createBadgeRegistration(DEFAULT_BADGE_THEME);

  let registration = defaultRegistration;
  let compiledCase = getBadgeRecipeCase(defaultRegistration.recipe, { tone, emphasis, size });
  let slotStyles = serializeBadgeSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_BADGE_THEME.name ? defaultRegistration : createBadgeRegistration(theme);
  $: compiledCase = getBadgeRecipeCase(registration.recipe, { tone, emphasis, size });
  $: slotStyles = serializeBadgeSlotStyles(compiledCase);
</script>

<span
  class="dk-badge"
  style={slotStyles.root}
  data-tone={tone}
  data-emphasis={emphasis}
  data-size={size}
>
  {#if $$slots.leading}
    <span class="badge-leading" style={slotStyles.leading}>
      <slot name="leading" />
    </span>
  {/if}
  <span class="badge-label" style={slotStyles.label}>
    <slot />
  </span>
</span>

<style>
  .dk-badge {
    align-items: center;
    background: var(--dk-badge-bg);
    border: var(--dk-badge-border-width) solid var(--dk-badge-border);
    border-radius: var(--dk-badge-radius);
    color: var(--dk-badge-fg);
    display: inline-flex;
    gap: var(--dk-badge-gap);
    min-block-size: var(--dk-badge-block-size);
    padding: 0 var(--dk-badge-inline-padding);
    white-space: nowrap;
  }

  .badge-leading {
    align-items: center;
    display: inline-flex;
    font-size: var(--dk-badge-leading-size);
    justify-content: center;
    line-height: 1;
  }

  .badge-label {
    color: var(--dk-badge-label-color);
    font-size: var(--dk-badge-label-size);
    font-weight: var(--dk-badge-label-weight);
    line-height: 1;
  }
</style>
