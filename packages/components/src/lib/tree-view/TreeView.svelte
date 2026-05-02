<script context="module" lang="ts">
  export type TreeViewItem = {
    id: string;
    label: string;
    description?: string;
    disabled?: boolean;
    children?: TreeViewItem[];
  };
</script>

<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import {
    flattenHierarchy,
    nextVisibleHierarchyIndex,
    toggleExpandedIds,
    type FlatHierarchyItem,
    type HierarchyItem
  } from '../internal/behavior/index.js';
  import {
    DEFAULT_TREE_VIEW_THEME,
    createTreeViewRegistration,
    getTreeViewRecipeCase,
    serializeTreeViewSlotStyles
  } from './tree-view.recipe.js';

  const dispatch = createEventDispatcher<{
    change: { value: string | undefined };
    expandedchange: { ids: string[] };
  }>();

  export let items: TreeViewItem[] = [];
  export let value: string | undefined = undefined;
  export let expandedIds: string[] = [];
  export let theme: ThemeContract = DEFAULT_TREE_VIEW_THEME;
  export let onChange: ((detail: { value: string | undefined }) => void) | undefined = undefined;
  export let onExpandedChange: ((detail: { ids: string[] }) => void) | undefined = undefined;

  const defaultRegistration = createTreeViewRegistration(DEFAULT_TREE_VIEW_THEME);

  let registration = defaultRegistration;
  let compiledCase = getTreeViewRecipeCase(defaultRegistration.recipe);
  let slotStyles = serializeTreeViewSlotStyles(compiledCase);
  let internalValue = value;
  let internalExpandedIds = [...expandedIds];
  let previousValue = value;
  let previousExpandedKey = expandedIds.join('|');
  let itemRefs: HTMLButtonElement[] = [];

  $: registration =
    theme.name === DEFAULT_TREE_VIEW_THEME.name ? defaultRegistration : createTreeViewRegistration(theme);
  $: compiledCase = getTreeViewRecipeCase(registration.recipe);
  $: slotStyles = serializeTreeViewSlotStyles(compiledCase);
  $: if (value !== previousValue) {
    internalValue = value;
    previousValue = value;
  }
  $: nextExpandedKey = expandedIds.join('|');
  $: if (nextExpandedKey !== previousExpandedKey) {
    internalExpandedIds = [...expandedIds];
    previousExpandedKey = nextExpandedKey;
  }
  $: visibleItems = flattenHierarchy(items as HierarchyItem[], internalExpandedIds, 0);
  $: activeIndex = Math.max(0, visibleItems.findIndex((entry) => entry.id === internalValue));

  function emitExpanded(ids: string[]): void {
    internalExpandedIds = ids;
    expandedIds = ids;
    previousExpandedKey = ids.join('|');
    onExpandedChange?.({ ids });
    dispatch('expandedchange', { ids });
  }

  function emitChange(nextValue: string | undefined): void {
    internalValue = nextValue;
    value = nextValue;
    previousValue = nextValue;
    onChange?.({ value: nextValue });
    dispatch('change', { value: nextValue });
  }

  function toggleBranch(item: TreeViewItem): void {
    if (!item.children?.length) {
      return;
    }
    emitExpanded(toggleExpandedIds(internalExpandedIds, item.id));
  }

  function focusVisible(index: number): void {
    void tick().then(() => {
      itemRefs[index]?.focus();
    });
  }

  function handleKeydown(event: KeyboardEvent, entry: FlatHierarchyItem<HierarchyItem>, index: number): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Home' || event.key === 'End') {
      const nextIndex = nextVisibleHierarchyIndex(visibleItems, index, event.key);
      focusVisible(nextIndex);
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowRight') {
      if (entry.hasChildren && !entry.expanded) {
        toggleBranch(entry.item as TreeViewItem);
      } else if (entry.hasChildren && visibleItems[index + 1]) {
        focusVisible(index + 1);
      }
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowLeft') {
      if (entry.hasChildren && entry.expanded) {
        toggleBranch(entry.item as TreeViewItem);
      } else if (entry.parentId) {
        const parentIndex = visibleItems.findIndex((item) => item.id === entry.parentId);
        if (parentIndex >= 0) {
          focusVisible(parentIndex);
        }
      }
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      emitChange(entry.id);
      event.preventDefault();
    }
  }
</script>

<div class="tree-view" style={slotStyles.root} role="tree" aria-label="Tree view">
  {#each visibleItems as entry, index (entry.id)}
    <div
      class="tree-row"
      role="treeitem"
      aria-level={entry.depth + 1}
      aria-expanded={entry.hasChildren ? (entry.expanded ? 'true' : 'false') : undefined}
      aria-selected={internalValue === entry.id ? 'true' : 'false'}
      data-depth={entry.depth}
    >
      <div class="tree-item-shell">
        {#if entry.hasChildren}
          <button
            class="tree-branch"
            style={slotStyles.branch}
            type="button"
            aria-label={entry.expanded ? `Collapse ${entry.item.label}` : `Expand ${entry.item.label}`}
            onclick={(event) => {
              event.stopPropagation();
              toggleBranch(entry.item as TreeViewItem);
            }}
          >
            {entry.expanded ? '▾' : '▸'}
          </button>
        {/if}

        <button
          bind:this={itemRefs[index]}
          class="tree-item"
          style={slotStyles.item}
          type="button"
          data-selected={internalValue === entry.id ? 'true' : 'false'}
          disabled={entry.item.disabled}
          onclick={() => emitChange(entry.id)}
          onkeydown={(event) => handleKeydown(event, entry, index)}
        >
          <span class="tree-copy">
            <span class="tree-label" style={slotStyles.label}>{entry.item.label}</span>
            {#if entry.item.description}
              <span class="tree-description" style={slotStyles.description}>{entry.item.description}</span>
            {/if}
          </span>
        </button>
      </div>
    </div>
  {/each}
</div>

<style>
  .tree-view {
    display: grid;
    gap: var(--dk-tree-gap);
  }

  .tree-item-shell {
    align-items: center;
    display: grid;
    gap: 0.35rem;
    grid-template-columns: auto minmax(0, 1fr);
  }

  .tree-row[data-depth='1'] {
    margin-left: 1rem;
  }

  .tree-item {
    align-items: center;
    background: var(--dk-tree-item-bg);
    border: 0;
    border-radius: var(--dk-tree-item-radius);
    color: var(--dk-tree-item-fg);
    display: flex;
    gap: 0.5rem;
    min-block-size: var(--dk-tree-item-min-height);
    padding-inline: var(--dk-tree-item-inline-padding);
    text-align: left;
    width: 100%;
  }

  .tree-item[data-selected='true'] {
    background: var(--dk-tree-item-bg-selected, var(--dk-tree-item-bg));
    color: var(--dk-tree-item-fg-selected, var(--dk-tree-item-fg));
  }

  .tree-branch {
    background: transparent;
    border: 0;
    color: inherit;
    font-size: var(--dk-tree-branch-size);
    padding: 0;
  }

  .tree-copy {
    display: grid;
    gap: 0.1rem;
  }

  .tree-label {
    font-size: var(--dk-tree-label-size);
    font-weight: var(--dk-tree-label-weight);
  }

  .tree-description {
    color: var(--dk-tree-description-fg);
    font-size: var(--dk-tree-description-size);
  }
</style>
