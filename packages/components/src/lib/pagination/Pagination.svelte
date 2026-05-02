<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import {
    DEFAULT_PAGINATION_THEME,
    createPaginationRegistration,
    getPaginationRecipeCase,
    serializePaginationSlotStyles
  } from './pagination.recipe.js';
  import type { PaginationSize } from './pagination.spec.js';

  const dispatch = createEventDispatcher<{ change: { page: number } }>();

  type PageToken = number | 'ellipsis';

  export let page = 1;
  export let pageCount = 1;
  export let siblingCount = 1;
  export let size: PaginationSize = 'md';
  export let theme: ThemeContract = DEFAULT_PAGINATION_THEME;
  export let onChange: ((detail: { page: number }) => void) | undefined = undefined;

  const defaultRegistration = createPaginationRegistration(DEFAULT_PAGINATION_THEME);

  let registration = defaultRegistration;
  let compiledCase = getPaginationRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializePaginationSlotStyles(compiledCase);

  $: registration =
    theme.name === DEFAULT_PAGINATION_THEME.name ? defaultRegistration : createPaginationRegistration(theme);
  $: compiledCase = getPaginationRecipeCase(registration.recipe, { size });
  $: slotStyles = serializePaginationSlotStyles(compiledCase);
  $: currentPage = Math.min(Math.max(page, 1), Math.max(pageCount, 1));
  $: pageTokens = buildPageTokens(currentPage, pageCount, siblingCount);

  function buildPageTokens(current: number, total: number, siblings: number): PageToken[] {
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const start = Math.max(2, current - siblings);
    const end = Math.min(total - 1, current + siblings);
    const tokens: PageToken[] = [1];

    if (start > 2) {
      tokens.push('ellipsis');
    }

    for (let value = start; value <= end; value += 1) {
      tokens.push(value);
    }

    if (end < total - 1) {
      tokens.push('ellipsis');
    }

    tokens.push(total);
    return tokens;
  }

  function updatePage(nextPage: number): void {
    if (nextPage < 1 || nextPage > pageCount || nextPage === currentPage) {
      return;
    }
    page = nextPage;
    onChange?.({ page: nextPage });
    dispatch('change', { page: nextPage });
  }
</script>

<nav class="dk-pagination" style={slotStyles.root} aria-label="Pagination">
  <button
    class="pagination-nav"
    style={`${slotStyles.item} ${slotStyles.nav}`}
    type="button"
    data-disabled={currentPage === 1}
    disabled={currentPage === 1}
    onclick={() => updatePage(currentPage - 1)}
  >
    Prev
  </button>

  {#each pageTokens as token, index (`${token}-${index}`)}
    {#if token === 'ellipsis'}
      <span class="pagination-ellipsis" style={slotStyles.ellipsis} aria-hidden="true">…</span>
    {:else if token === currentPage}
      <span class="pagination-item current" style={`${slotStyles.item} ${slotStyles.current}`} aria-current="page">
        {token}
      </span>
    {:else}
      <button class="pagination-item" style={slotStyles.item} type="button" onclick={() => updatePage(token)}>
        {token}
      </button>
    {/if}
  {/each}

  <button
    class="pagination-nav"
    style={`${slotStyles.item} ${slotStyles.nav}`}
    type="button"
    data-disabled={currentPage === pageCount}
    disabled={currentPage === pageCount}
    onclick={() => updatePage(currentPage + 1)}
  >
    Next
  </button>
</nav>

<style>
  .dk-pagination {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: var(--dk-pagination-gap);
  }

  .pagination-item,
  .pagination-nav,
  .pagination-ellipsis {
    align-items: center;
    border-radius: var(--dk-pagination-item-radius);
    display: inline-flex;
    font-size: var(--dk-pagination-item-size);
    justify-content: center;
    min-block-size: var(--dk-pagination-item-block-size);
    min-inline-size: var(--dk-pagination-item-inline-size);
  }

  .pagination-item,
  .pagination-nav {
    background: var(--dk-pagination-item-bg);
    border: var(--dk-pagination-item-border-width) solid var(--dk-pagination-item-border);
    color: var(--dk-pagination-item-fg);
    cursor: pointer;
  }

  .pagination-item.current {
    background: var(--dk-pagination-current-bg);
    border-color: var(--dk-pagination-current-border);
    color: var(--dk-pagination-current-fg);
    font-size: var(--dk-pagination-current-size);
  }

  .pagination-nav[data-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .pagination-ellipsis {
    color: var(--dk-pagination-ellipsis-fg);
    font-size: var(--dk-pagination-ellipsis-size);
  }
</style>
