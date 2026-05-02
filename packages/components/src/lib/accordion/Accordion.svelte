<script context="module" lang="ts">
  export type AccordionItem = {
    value: string;
    label: string;
    content: string;
    description?: string;
    disabled?: boolean;
  };
</script>

<script lang="ts">
  import { writable } from 'svelte/store';
  import type { ThemeContract } from '@dkcli/core';

  import {
    DEFAULT_ACCORDION_THEME,
    createAccordionRegistration,
    getAccordionRecipeCase,
    serializeAccordionSlotStyles
  } from './accordion.recipe.js';
  import type { AccordionSize } from './accordion.spec.js';

  export let items: AccordionItem[] = [];
  export let value: string | string[] | undefined = undefined;
  export let size: AccordionSize = 'md';
  export let allowMultiple = false;
  export let theme: ThemeContract = DEFAULT_ACCORDION_THEME;

  const defaultRegistration = createAccordionRegistration(DEFAULT_ACCORDION_THEME);

  let registration = defaultRegistration;
  const openValues = writable<string[]>(normalizeValue(value, allowMultiple));
  let compiledCase = getAccordionRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeAccordionSlotStyles(compiledCase);

  $: registration =
    theme.name === DEFAULT_ACCORDION_THEME.name ? defaultRegistration : createAccordionRegistration(theme);
  $: if (value !== undefined) {
    openValues.set(normalizeValue(value, allowMultiple));
  }
  $: compiledCase = getAccordionRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeAccordionSlotStyles(compiledCase);

  function normalizeValue(
    input: string | string[] | undefined,
    multiple: boolean,
    fallback: string[] = []
  ): string[] {
    if (Array.isArray(input)) {
      return multiple ? input : input.slice(0, 1);
    }
    if (typeof input === 'string') {
      return [input];
    }
    return fallback;
  }

  function isOpen(itemValue: string): boolean {
    return $openValues.includes(itemValue);
  }

  function toggleItem(itemValue: string, disabled: boolean | undefined): void {
    if (disabled) {
      return;
    }
    if (allowMultiple) {
      openValues.set(
        isOpen(itemValue)
          ? $openValues.filter((entry) => entry !== itemValue)
          : [...$openValues, itemValue]
      );
      return;
    }
    openValues.set(isOpen(itemValue) ? [] : [itemValue]);
  }

  function handleKeydown(event: KeyboardEvent, itemValue: string, disabled: boolean | undefined): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    toggleItem(itemValue, disabled);
  }
</script>

<div class="dk-accordion" style={slotStyles.root}>
  {#each items as item (item.value)}
    {@const open = $openValues.includes(item.value)}
    <article class="accordion-item" style={slotStyles.item}>
      <button
        class="accordion-trigger"
        style={slotStyles.trigger}
        type="button"
        data-open={open}
        data-disabled={item.disabled}
        aria-expanded={open}
        aria-controls={`accordion-panel-${item.value}`}
        id={`accordion-trigger-${item.value}`}
        disabled={item.disabled}
        on:keydown={(event) => handleKeydown(event, item.value, item.disabled)}
        on:click={() => toggleItem(item.value, item.disabled)}
      >
        <span class="accordion-copy">
          <span class="accordion-label" style={slotStyles.label}>{item.label}</span>
          {#if item.description}
            <span class="accordion-description" style={slotStyles.description}>{item.description}</span>
          {/if}
        </span>
        <span class="accordion-indicator" style={slotStyles.indicator} aria-hidden="true">⌄</span>
      </button>

      {#if open}
        <section
          class="accordion-panel"
          style={slotStyles.panel}
          id={`accordion-panel-${item.value}`}
          aria-labelledby={`accordion-trigger-${item.value}`}
        >
          <p>{item.content}</p>
        </section>
      {/if}
    </article>
  {/each}
</div>

<style>
  .dk-accordion {
    display: grid;
    gap: var(--dk-accordion-gap);
  }

  .accordion-item {
    background: var(--dk-accordion-item-bg);
    border: var(--dk-accordion-item-border-width) solid var(--dk-accordion-item-border);
    border-radius: var(--dk-accordion-item-radius);
    overflow: clip;
  }

  .accordion-trigger {
    align-items: center;
    background: var(--dk-accordion-trigger-bg);
    border: 0;
    color: var(--dk-accordion-trigger-fg);
    cursor: pointer;
    display: grid;
    gap: var(--dk-accordion-trigger-gap);
    grid-template-columns: minmax(0, 1fr) auto;
    inline-size: 100%;
    min-block-size: var(--dk-accordion-trigger-block-size);
    padding-inline: var(--dk-accordion-trigger-inline-padding);
    text-align: left;
  }

  .accordion-trigger[data-open='true'] {
    background: var(--dk-accordion-trigger-bg-open, var(--dk-accordion-trigger-bg));
    color: var(--dk-accordion-trigger-fg-open, var(--dk-accordion-trigger-fg));
  }

  .accordion-trigger[data-disabled='true'] {
    color: var(--dk-accordion-trigger-fg-disabled, var(--dk-accordion-trigger-fg));
    cursor: not-allowed;
  }

  .accordion-trigger:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--dk-accordion-trigger-fg-open, var(--dk-accordion-trigger-fg)) 22%, transparent);
    outline-offset: -2px;
  }

  .accordion-copy {
    display: grid;
    gap: 0.2rem;
  }

  .accordion-label {
    color: inherit;
    font-size: var(--dk-accordion-label-size);
    font-weight: var(--dk-accordion-label-weight);
    line-height: 1.3;
  }

  .accordion-description {
    color: var(--dk-accordion-description-color);
    font-size: var(--dk-accordion-description-size);
    line-height: 1.45;
  }

  .accordion-trigger[data-open='true'] .accordion-description {
    color: color-mix(in srgb, currentColor 74%, transparent);
  }

  .accordion-indicator {
    color: var(--dk-accordion-indicator-color);
    display: inline-flex;
    font-size: var(--dk-accordion-indicator-size);
    justify-content: center;
    line-height: 1;
    transform: rotate(0deg);
    transition: transform 160ms ease;
  }

  .accordion-trigger[data-open='true'] .accordion-indicator {
    color: var(--dk-accordion-indicator-color-open, var(--dk-accordion-indicator-color));
    transform: rotate(180deg);
  }

  .accordion-panel {
    background: var(--dk-accordion-panel-bg);
    color: var(--dk-accordion-panel-fg);
    padding: 0 var(--dk-accordion-panel-padding) var(--dk-accordion-panel-padding);
  }

  .accordion-panel :global(p) {
    font-size: var(--dk-accordion-panel-size);
    line-height: 1.6;
    margin: 0;
  }
</style>
