<script lang="ts">
  import type { ThemeContract } from '@dkcli/core';

  import {
    DEFAULT_PROGRESS_THEME,
    createProgressRegistration,
    getProgressRecipeCase,
    serializeProgressSlotStyles
  } from './progress.recipe.js';
  import type { ProgressSize, ProgressTone } from './progress.spec.js';

  export let value = 0;
  export let label = 'Progress';
  export let showValue = true;
  export let tone: ProgressTone = 'brand';
  export let size: ProgressSize = 'md';
  export let theme: ThemeContract = DEFAULT_PROGRESS_THEME;

  const defaultRegistration = createProgressRegistration(DEFAULT_PROGRESS_THEME);

  let registration = defaultRegistration;
  let compiledCase = getProgressRecipeCase(defaultRegistration.recipe, { tone, size });
  let slotStyles = serializeProgressSlotStyles(compiledCase);

  $: registration =
    theme.name === DEFAULT_PROGRESS_THEME.name ? defaultRegistration : createProgressRegistration(theme);
  $: compiledCase = getProgressRecipeCase(registration.recipe, { tone, size });
  $: slotStyles = serializeProgressSlotStyles(compiledCase);
  $: clampedValue = Math.max(0, Math.min(100, value));
</script>

<div class="dk-progress" style={slotStyles.root}>
  <div class="progress-header" style={slotStyles.header}>
    <span class="progress-label" style={slotStyles.label}>{label}</span>
    {#if showValue}
      <span class="progress-value" style={slotStyles.value}>{clampedValue}%</span>
    {/if}
  </div>

  <div
    class="progress-track"
    style={slotStyles.track}
    role="progressbar"
    aria-label={label}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={clampedValue}
  >
    <span
      class="progress-indicator"
      style={`${slotStyles.indicator}; inline-size: ${clampedValue}%;`}
    ></span>
  </div>
</div>

<style>
  .dk-progress {
    display: grid;
    gap: var(--dk-progress-gap);
  }

  .progress-header {
    align-items: baseline;
    display: flex;
    gap: var(--dk-progress-header-gap);
    justify-content: space-between;
  }

  .progress-label {
    color: var(--dk-progress-label-color);
    font-size: var(--dk-progress-label-size);
    font-weight: var(--dk-progress-label-weight);
  }

  .progress-value {
    color: var(--dk-progress-value-color);
    font-size: var(--dk-progress-value-size);
  }

  .progress-track {
    background: var(--dk-progress-track-bg);
    border-radius: var(--dk-progress-track-radius);
    block-size: var(--dk-progress-track-block-size);
    overflow: hidden;
  }

  .progress-indicator {
    background: var(--dk-progress-indicator-bg);
    block-size: 100%;
    border-radius: var(--dk-progress-indicator-radius);
    display: block;
  }
</style>
