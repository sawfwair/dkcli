<script context="module" lang="ts">
  export type TabItem = {
    value: string;
    label: string;
    disabled?: boolean;
  };
</script>

<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import { moveRovingIndex } from '../internal/behavior/index.js';
  import {
    DEFAULT_TABS_THEME,
    createTabsRegistration,
    getTabsRecipeCase,
    serializeTabsSlotStyles
  } from './tabs.recipe.js';
  import type { TabsOrientation, TabsSize } from './tabs.spec.js';

  export let value: string | undefined = undefined;
  export let items: TabItem[] = [];
  export let orientation: TabsOrientation = 'horizontal';
  export let activation: 'automatic' | 'manual' = 'automatic';
  export let size: TabsSize = 'md';
  export let panels: Record<string, string> = {};
  export let theme: ThemeContract = DEFAULT_TABS_THEME;
  export let onChange: ((detail: { value: string }) => void) | undefined = undefined;

  const defaultRegistration = createTabsRegistration(DEFAULT_TABS_THEME);
  const dispatch = createEventDispatcher<{ change: { value: string } }>();

  let registration = defaultRegistration;
  let currentValue = value;
  let focusedIndex = 0;
  let triggerRefs: HTMLButtonElement[] = [];
  let compiledCase = getTabsRecipeCase(defaultRegistration.recipe, { size, orientation });
  let slotStyles = serializeTabsSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_TABS_THEME.name ? defaultRegistration : createTabsRegistration(theme);
  $: currentValue = value ?? currentValue ?? items.find((item) => !item.disabled)?.value;
  $: focusedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === currentValue)
  );
  $: compiledCase = getTabsRecipeCase(registration.recipe, { size, orientation });
  $: slotStyles = serializeTabsSlotStyles(compiledCase);

  async function focusTab(index: number): Promise<void> {
    await tick();
    triggerRefs[index]?.focus();
  }

  function selectTab(nextValue: string, index: number): void {
    currentValue = nextValue;
    value = nextValue;
    focusedIndex = index;
    onChange?.({ value: nextValue });
    dispatch('change', { value: nextValue });
  }

  function handleKeydown(event: KeyboardEvent): void {
    const nextIndex = moveRovingIndex(items, focusedIndex, event.key, orientation);
    if (nextIndex === focusedIndex) {
      if (activation === 'manual' && (event.key === 'Enter' || event.key === ' ')) {
        const nextValue = items[focusedIndex]?.value;
        if (nextValue) {
          selectTab(nextValue, focusedIndex);
          event.preventDefault();
        }
      }
      return;
    }

    focusedIndex = nextIndex;
    if (activation === 'automatic') {
      const nextValue = items[nextIndex]?.value;
      if (nextValue) {
        selectTab(nextValue, nextIndex);
      }
    }
    void focusTab(nextIndex);
    event.preventDefault();
  }

</script>

<div class="dk-tabs" style={slotStyles.root} data-orientation={orientation}>
  <div
    class="tabs-list"
    role="tablist"
    aria-orientation={orientation}
    tabindex="-1"
    style={slotStyles.list}
    onkeydown={handleKeydown}
  >
    {#each items as item, index (item.value)}
      {@const selected = currentValue === item.value}
      <button
        bind:this={triggerRefs[index]}
        class="tabs-trigger"
        style={`${slotStyles.trigger} ${slotStyles.indicator}`}
        role="tab"
        type="button"
        aria-selected={selected ? 'true' : 'false'}
        aria-controls={`panel-${item.value}`}
        id={`tab-${item.value}`}
        tabindex={selected ? 0 : -1}
        data-selected={selected}
        disabled={item.disabled}
        onclick={() => selectTab(item.value, index)}
      >
        <span>{item.label}</span>
        <span class="tabs-indicator" aria-hidden="true"></span>
      </button>
    {/each}
  </div>

  {#each items as item (item.value)}
    {#if currentValue === item.value}
      <div
        class="tabs-panel"
        style={slotStyles.panel}
        role="tabpanel"
        id={`panel-${item.value}`}
        aria-labelledby={`tab-${item.value}`}
      >
        {#if panels[item.value]}
          <p>{panels[item.value]}</p>
        {:else}
          <p>No panel content supplied.</p>
        {/if}
      </div>
    {/if}
  {/each}
</div>

<style>
  .dk-tabs {
    display: grid;
    gap: var(--dk-tabs-gap);
  }

  .tabs-list {
    align-items: stretch;
    background: var(--dk-tabs-list-bg);
    border-radius: var(--dk-tabs-list-radius);
    display: flex;
    flex-wrap: wrap;
    gap: var(--dk-tabs-list-gap);
    padding: 0.1875rem;
  }

  .dk-tabs[data-orientation='vertical'] .tabs-list {
    flex-direction: column;
  }

  .tabs-trigger {
    align-items: center;
    background: var(--dk-tabs-trigger-bg);
    border: 0;
    border-radius: var(--dk-tabs-trigger-radius);
    color: var(--dk-tabs-trigger-fg);
    cursor: pointer;
    display: inline-flex;
    font-family: inherit;
    font-size: var(--dk-tabs-trigger-font-size);
    font-weight: var(--dk-tabs-trigger-font-weight, 600);
    justify-content: center;
    min-block-size: var(--dk-tabs-trigger-block-size);
    padding: 0 var(--dk-tabs-trigger-inline-padding);
    position: relative;
    transition:
      background-color var(--dk-tabs-trigger-motion-duration) ease,
      color var(--dk-tabs-trigger-motion-duration) ease;
  }

  .tabs-trigger[data-selected='true'] {
    background: var(--dk-tabs-trigger-bg-selected, var(--dk-tabs-trigger-bg));
    color: var(--dk-tabs-trigger-fg-selected, var(--dk-tabs-trigger-fg));
  }

  .tabs-trigger:disabled {
    color: var(--dk-tabs-trigger-fg-disabled, var(--dk-tabs-trigger-fg));
    cursor: not-allowed;
  }

  .tabs-trigger:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--dk-tabs-indicator-bg) 40%, transparent);
    outline-offset: -1px;
  }

  .tabs-indicator {
    background: var(--dk-tabs-indicator-bg);
    block-size: var(--dk-tabs-indicator-thickness);
    border-radius: 999px;
    inset: auto 0 0 0;
    opacity: 0;
    position: absolute;
  }

  .tabs-trigger[data-selected='true'] .tabs-indicator {
    opacity: 1;
  }

  .tabs-panel {
    background: var(--dk-tabs-panel-bg);
    border-radius: var(--dk-tabs-panel-radius);
    color: var(--dk-tabs-panel-fg);
    padding: var(--dk-tabs-panel-padding);
  }

  .tabs-panel :global(p) {
    margin: 0;
    line-height: 1.55;
  }
</style>
