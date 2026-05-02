<script context="module" lang="ts">
  export type SideNavItem = {
    id: string;
    label: string;
    href?: string;
    icon?: string;
    badge?: string;
    disabled?: boolean;
    children?: SideNavItem[];
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
    DEFAULT_SIDE_NAV_THEME,
    createSideNavRegistration,
    getSideNavRecipeCase,
    serializeSideNavSlotStyles
  } from './side-nav.recipe.js';

  const dispatch = createEventDispatcher<{ change: { id: string } }>();

  export let items: SideNavItem[] = [];
  export let activeId: string | undefined = undefined;
  export let collapsed = false;
  export let theme: ThemeContract = DEFAULT_SIDE_NAV_THEME;
  export let onChange: ((detail: { id: string }) => void) | undefined = undefined;

  const defaultRegistration = createSideNavRegistration(DEFAULT_SIDE_NAV_THEME);

  let registration = defaultRegistration;
  let compiledCase = getSideNavRecipeCase(defaultRegistration.recipe);
  let slotStyles = serializeSideNavSlotStyles(compiledCase);
  let internalActiveId = activeId;
  let previousActiveId = activeId;
  let internalExpandedIds: string[] = [];
  let itemRefs: HTMLButtonElement[] = [];

  $: registration =
    theme.name === DEFAULT_SIDE_NAV_THEME.name ? defaultRegistration : createSideNavRegistration(theme);
  $: compiledCase = getSideNavRecipeCase(registration.recipe);
  $: slotStyles = serializeSideNavSlotStyles(compiledCase);
  $: if (activeId !== previousActiveId) {
    internalActiveId = activeId;
    previousActiveId = activeId;
    if (activeId) {
      internalExpandedIds = [...new Set([...internalExpandedIds, ...ancestorIds(items, activeId)])];
    }
  }
  $: visibleItems = collapsed
    ? flattenHierarchy(items as HierarchyItem[], [], 0).filter((entry) => entry.depth === 0)
    : flattenHierarchy(items as HierarchyItem[], internalExpandedIds, 0);
  $: activeIndex = Math.max(
    0,
    visibleItems.findIndex((entry) => entry.id === internalActiveId)
  );

  function ancestorIds(tree: SideNavItem[], id: string, parents: string[] = []): string[] {
    for (const item of tree) {
      if (item.id === id) {
        return parents;
      }
      const next = ancestorIds(item.children ?? [], id, [...parents, item.id]);
      if (next.length > 0 || item.children?.some((child) => child.id === id)) {
        return next;
      }
    }
    return [];
  }

  function activate(item: SideNavItem): void {
    if (item.disabled) {
      return;
    }
    internalActiveId = item.id;
    activeId = item.id;
    previousActiveId = item.id;
    onChange?.({ id: item.id });
    dispatch('change', { id: item.id });
  }

  function toggleBranch(item: SideNavItem): void {
    if (!item.children?.length) {
      return;
    }
    internalExpandedIds = toggleExpandedIds(internalExpandedIds, item.id);
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

    if (event.key === 'ArrowRight' && entry.hasChildren) {
      if (!entry.expanded) {
        internalExpandedIds = toggleExpandedIds(internalExpandedIds, entry.id);
      } else if (visibleItems[index + 1]) {
        focusVisible(index + 1);
      }
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowLeft') {
      if (entry.hasChildren && entry.expanded) {
        internalExpandedIds = toggleExpandedIds(internalExpandedIds, entry.id);
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
      activate(entry.item as SideNavItem);
      if (entry.hasChildren) {
        toggleBranch(entry.item as SideNavItem);
      }
      event.preventDefault();
    }
  }
</script>

<nav class="side-nav" style={slotStyles.root} aria-label="Side navigation">
  <ul class="side-nav-list">
    {#each visibleItems as entry, index (entry.id)}
      <li class="side-nav-row">
        <div class="side-nav-item-shell" data-depth={entry.depth}>
          {#if entry.hasChildren && !collapsed}
            <button
              class="side-nav-branch"
              style={slotStyles.branch}
              type="button"
              aria-label={entry.expanded ? `Collapse ${entry.item.label}` : `Expand ${entry.item.label}`}
              onclick={() => toggleBranch(entry.item as SideNavItem)}
            >
              {entry.expanded ? '▾' : '▸'}
            </button>
          {/if}

          <button
            bind:this={itemRefs[index]}
            class="side-nav-item"
            style={slotStyles.item}
            type="button"
            aria-current={internalActiveId === entry.id ? 'page' : undefined}
            aria-expanded={entry.hasChildren ? (entry.expanded ? 'true' : 'false') : undefined}
            data-selected={internalActiveId === entry.id ? 'true' : 'false'}
            disabled={entry.item.disabled}
            onclick={() => activate(entry.item as SideNavItem)}
            onkeydown={(event) => handleKeydown(event, entry, index)}
          >
            <span class="side-nav-copy" style={slotStyles.label}>
              {#if (entry.item as SideNavItem).icon}
                <span class="side-nav-icon" aria-hidden="true">{(entry.item as SideNavItem).icon}</span>
              {/if}
              <span class="side-nav-label">{collapsed ? entry.item.label.slice(0, 1) : entry.item.label}</span>
            </span>

            {#if (entry.item as SideNavItem).badge && !collapsed}
              <span class="side-nav-badge" style={slotStyles.badge}>{(entry.item as SideNavItem).badge}</span>
            {/if}
          </button>
        </div>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .side-nav,
  .side-nav-list {
    display: grid;
  }

  .side-nav {
    background: var(--dk-side-nav-bg);
    border: 1px solid var(--dk-side-nav-border);
    border-radius: 1rem;
    color: var(--dk-side-nav-fg);
    padding: var(--dk-side-nav-padding);
  }

  .side-nav-list {
    gap: var(--dk-side-nav-gap);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .side-nav-item-shell {
    align-items: center;
    display: grid;
    gap: 0.4rem;
    grid-template-columns: auto minmax(0, 1fr);
  }

  .side-nav-item-shell[data-depth='1'] {
    margin-left: 1rem;
  }

  .side-nav-item {
    align-items: center;
    background: var(--dk-side-nav-item-bg);
    border: 0;
    border-radius: var(--dk-side-nav-item-radius);
    color: var(--dk-side-nav-item-fg);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    min-block-size: var(--dk-side-nav-item-min-height);
    padding-inline: var(--dk-side-nav-item-inline-padding);
    text-align: left;
    width: 100%;
  }

  .side-nav-item[data-selected='true'] {
    background: var(--dk-side-nav-item-bg-selected, var(--dk-side-nav-item-bg));
    color: var(--dk-side-nav-item-fg-selected, var(--dk-side-nav-item-fg));
  }

  .side-nav-copy {
    align-items: center;
    display: inline-flex;
    gap: 0.5rem;
  }

  .side-nav-label {
    font-size: var(--dk-side-nav-label-size);
    font-weight: var(--dk-side-nav-label-weight);
  }

  .side-nav-badge {
    font-size: var(--dk-side-nav-badge-size);
  }

  .side-nav-branch {
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
    inline-size: 1.5rem;
    font-size: var(--dk-side-nav-branch-size);
    padding: 0;
  }
 </style>
