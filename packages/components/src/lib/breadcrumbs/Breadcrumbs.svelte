<script context="module" lang="ts">
  export type BreadcrumbItem = {
    label: string;
    href?: string;
    current?: boolean;
  };
</script>

<script lang="ts">
  import type { ThemeContract } from '@dkcli/core';

  import {
    DEFAULT_BREADCRUMBS_THEME,
    createBreadcrumbsRegistration,
    getBreadcrumbsRecipeCase,
    serializeBreadcrumbsSlotStyles
  } from './breadcrumbs.recipe.js';
  import { sanitizeHref } from '../shared/url.js';
  import type { BreadcrumbsSize } from './breadcrumbs.spec.js';

  export let items: BreadcrumbItem[] = [];
  export let size: BreadcrumbsSize = 'md';
  export let theme: ThemeContract = DEFAULT_BREADCRUMBS_THEME;

  const defaultRegistration = createBreadcrumbsRegistration(DEFAULT_BREADCRUMBS_THEME);

  let registration = defaultRegistration;
  let compiledCase = getBreadcrumbsRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeBreadcrumbsSlotStyles(compiledCase);

  $: registration =
    theme.name === DEFAULT_BREADCRUMBS_THEME.name ? defaultRegistration : createBreadcrumbsRegistration(theme);
  $: compiledCase = getBreadcrumbsRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeBreadcrumbsSlotStyles(compiledCase);

  $: currentIndex = items.findIndex((item) => item.current);
  $: resolvedCurrentIndex = currentIndex === -1 ? Math.max(items.length - 1, 0) : currentIndex;
</script>

<nav class="dk-breadcrumbs" style={slotStyles.root} aria-label="Breadcrumb">
  <ol>
    {#each items as item, index (item.label + index)}
      {@const current = index === resolvedCurrentIndex}
      {@const safeHref = sanitizeHref(item.href)}
      <li class="breadcrumb-item">
        {#if current}
          <span class="breadcrumb-current" style={slotStyles.current} aria-current="page">{item.label}</span>
        {:else if safeHref}
          <a class="breadcrumb-link" style={slotStyles.item} href={safeHref}>{item.label}</a>
        {:else}
          <span class="breadcrumb-link" style={slotStyles.item}>{item.label}</span>
        {/if}

        {#if index < items.length - 1}
          <span class="breadcrumb-separator" style={slotStyles.separator} aria-hidden="true">›</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .dk-breadcrumbs ol {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: var(--dk-breadcrumbs-gap);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .breadcrumb-item {
    align-items: center;
    display: inline-flex;
    gap: var(--dk-breadcrumbs-gap);
    min-block-size: var(--dk-breadcrumbs-item-block-size);
  }

  .breadcrumb-link,
  .breadcrumb-current {
    align-items: center;
    border-radius: var(--dk-breadcrumbs-item-radius);
    color: var(--dk-breadcrumbs-item-fg);
    display: inline-flex;
    font-size: var(--dk-breadcrumbs-item-size);
    min-block-size: var(--dk-breadcrumbs-item-block-size);
    padding-inline: var(--dk-breadcrumbs-item-inline-padding);
    text-decoration: none;
  }

  .breadcrumb-current {
    background: var(--dk-breadcrumbs-current-bg);
    border-radius: var(--dk-breadcrumbs-current-radius);
    color: var(--dk-breadcrumbs-current-fg);
    font-size: var(--dk-breadcrumbs-current-size);
    padding-inline: var(--dk-breadcrumbs-current-inline-padding);
  }

  .breadcrumb-separator {
    color: var(--dk-breadcrumbs-separator-fg);
    font-size: var(--dk-breadcrumbs-separator-size);
    line-height: 1;
  }
</style>
