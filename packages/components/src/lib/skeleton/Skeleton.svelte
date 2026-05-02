<script lang="ts">
  import type { ThemeContract } from '@dkcli/core';

  import {
    DEFAULT_SKELETON_THEME,
    createSkeletonRegistration,
    getSkeletonRecipeCase,
    serializeSkeletonSlotStyles
  } from './skeleton.recipe.js';
  import type { SkeletonSize, SkeletonVariant } from './skeleton.spec.js';

  export let variant: SkeletonVariant = 'text';
  export let size: SkeletonSize = 'md';
  export let lines = 3;
  export let animated = true;
  export let theme: ThemeContract = DEFAULT_SKELETON_THEME;

  const defaultRegistration = createSkeletonRegistration(DEFAULT_SKELETON_THEME);

  let registration = defaultRegistration;
  let compiledCase = getSkeletonRecipeCase(defaultRegistration.recipe, { variant, size });
  let slotStyles = serializeSkeletonSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_SKELETON_THEME.name ? defaultRegistration : createSkeletonRegistration(theme);
  $: compiledCase = getSkeletonRecipeCase(registration.recipe, { variant, size });
  $: slotStyles = serializeSkeletonSlotStyles(compiledCase);

  function lineWidth(index: number): string {
    if (variant !== 'text') {
      return '100%';
    }
    if (index === lines - 1) {
      return '72%';
    }
    if (index === lines - 2) {
      return '86%';
    }
    return '100%';
  }
</script>

<div
  class="dk-skeleton"
  data-variant={variant}
  data-animated={animated}
  style={slotStyles.root}
  aria-hidden="true"
>
  {#if variant === 'text'}
    {#each Array.from({ length: lines }) as _, index (`line-${index}`)}
      <span class="skeleton-line" style={`${slotStyles.line}; inline-size: ${lineWidth(index)};`}></span>
    {/each}
  {:else}
    <span class="skeleton-block" style={slotStyles.line}></span>
  {/if}
</div>

<style>
  .dk-skeleton {
    display: grid;
    gap: var(--dk-skeleton-gap);
    inline-size: min(100%, var(--dk-skeleton-inline-size));
  }

  .skeleton-line,
  .skeleton-block {
    background: linear-gradient(
      90deg,
      var(--dk-skeleton-bg) 0%,
      var(--dk-skeleton-shimmer) 48%,
      var(--dk-skeleton-bg) 100%
    );
    background-size: 220% 100%;
    border-radius: var(--dk-skeleton-line-radius, var(--dk-skeleton-radius));
    block-size: var(--dk-skeleton-block-size);
    display: block;
  }

  .dk-skeleton[data-animated='true'] .skeleton-line,
  .dk-skeleton[data-animated='true'] .skeleton-block {
    animation: dk-skeleton-shimmer 1.4s linear infinite;
  }

  .dk-skeleton[data-variant='avatar'] .skeleton-block {
    inline-size: var(--dk-skeleton-inline-size);
  }

  @keyframes dk-skeleton-shimmer {
    0% {
      background-position: 100% 0;
    }

    100% {
      background-position: -100% 0;
    }
  }
</style>
