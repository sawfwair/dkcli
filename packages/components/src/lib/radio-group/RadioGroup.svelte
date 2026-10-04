<script module lang="ts">
  export type RadioGroupItem = {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  };
</script>

<script lang="ts">
  import { run } from 'svelte/legacy';
  import { createEventDispatcher, untrack } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import {
    DEFAULT_RADIO_GROUP_THEME,
    createRadioGroupRegistration,
    getRadioGroupRecipeCase,
    serializeRadioGroupSlotStyles
  } from './radio-group.recipe.js';
  import type { RadioGroupOrientation, RadioGroupSize } from './radio-group.spec.js';

  const uid = $props.id();
  const localId = `dk-radio-group-${uid}`;

  const dispatch = createEventDispatcher<{ change: { value: string } }>();

  interface Props {
    value?: string | undefined;
    items?: RadioGroupItem[];
    orientation?: RadioGroupOrientation;
    label?: string | undefined;
    description?: string | undefined;
    error?: string | undefined;
    required?: boolean;
    disabled?: boolean;
    name?: string;
    size?: RadioGroupSize;
    theme?: ThemeContract;
    onChange?: ((detail: { value: string }) => void) | undefined;
  }

  let {
    value = $bindable(undefined),
    items = $bindable([]),
    orientation = $bindable('vertical'),
    label = $bindable(undefined),
    description = $bindable(undefined),
    error = $bindable(undefined),
    required = $bindable(false),
    disabled = $bindable(false),
    name = $bindable(localId),
    size = $bindable('md'),
    theme = $bindable(DEFAULT_RADIO_GROUP_THEME),
    onChange = $bindable(undefined)
  }: Props = $props();

  const defaultRegistration = createRadioGroupRegistration(DEFAULT_RADIO_GROUP_THEME);

  let currentValue = $state(untrack(() => value));

  let registration = $derived(theme.name === DEFAULT_RADIO_GROUP_THEME.name ? defaultRegistration : createRadioGroupRegistration(theme));
  run(() => {
    currentValue = value ?? currentValue ?? items.find((item) => !item.disabled)?.value;
  });
  let invalid = $derived(Boolean(error));
  let compiledCase = $derived(getRadioGroupRecipeCase(registration.recipe, { size, orientation }));
  let slotStyles = $derived(serializeRadioGroupSlotStyles(compiledCase));
  let describedBy = $derived(error ? `${localId}-error` : description ? `${localId}-description` : undefined);

  function handleValueChange(nextValue: string): void {
    currentValue = nextValue;
    value = nextValue;
    onChange?.({ value: nextValue });
    dispatch('change', { value: nextValue });
  }
</script>

<fieldset
  class="dk-radio-group"
  style={slotStyles.root}
  data-orientation={orientation}
  disabled={disabled}
  aria-describedby={describedBy}
>
  {#if label}
    <legend class="radio-legend" style={slotStyles.legend}>
      {label}
      {#if required}
        <span aria-hidden="true">*</span>
      {/if}
    </legend>
  {/if}

  <div class="radio-items">
    {#each items as item (item.value)}
      {@const selected = currentValue === item.value}
      <label
        class="radio-item"
        style={slotStyles.item}
        data-selected={selected}
        data-disabled={disabled || item.disabled}
        data-invalid={invalid}
      >
        <input
          class="sr-only"
          type="radio"
          {name}
          value={item.value}
          bind:group={currentValue}
          disabled={disabled || item.disabled}
          onchange={() => handleValueChange(item.value)}
        />

        <span class="radio-control" style={slotStyles.control} aria-hidden="true">
          <span class="radio-mark" style={slotStyles.mark}></span>
        </span>

        <span class="radio-copy">
          <span class="radio-label" style={slotStyles.itemLabel}>{item.label}</span>
          {#if item.description}
            <span class="radio-description" style={slotStyles.itemDescription}>{item.description}</span>
          {/if}
        </span>
      </label>
    {/each}
  </div>

  {#if error}
    <p class="radio-meta radio-error" style={slotStyles.error} id={`${localId}-error`}>{error}</p>
  {:else if description}
    <p class="radio-meta radio-description" style={slotStyles.description} id={`${localId}-description`}>{description}</p>
  {/if}
</fieldset>

<style>
  .dk-radio-group {
    border: 0;
    display: grid;
    gap: var(--dk-radio-group-gap);
    margin: 0;
    min-inline-size: 0;
    padding: 0;
  }

  .radio-legend {
    color: var(--dk-radio-legend-color);
    font-size: var(--dk-radio-legend-size);
    font-weight: var(--dk-radio-legend-weight);
    padding: 0;
  }

  .radio-items {
    display: grid;
    gap: var(--dk-radio-group-gap);
  }

  .dk-radio-group[data-orientation='horizontal'] .radio-items {
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  }

  .radio-item {
    align-items: flex-start;
    cursor: pointer;
    display: flex;
    gap: var(--dk-radio-item-gap);
    min-block-size: var(--dk-radio-group-hit-size);
  }

  .sr-only {
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }

  .radio-control {
    align-items: center;
    background: var(--dk-radio-control-bg);
    border: var(--dk-radio-control-border-width) solid var(--dk-radio-control-border);
    border-radius: 50%;
    display: inline-flex;
    flex: 0 0 auto;
    height: var(--dk-radio-control-size);
    justify-content: center;
    margin-top: 0.12rem;
    width: var(--dk-radio-control-size);
  }

  .radio-item:focus-within .radio-control {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--dk-radio-focus-ring-color) 22%, transparent);
  }

  .radio-mark {
    background: var(--dk-radio-mark-bg);
    block-size: var(--dk-radio-mark-size);
    border-radius: 50%;
    inline-size: var(--dk-radio-mark-size);
    opacity: 0;
  }

  .radio-item[data-selected='true'] .radio-control {
    border-color: var(--dk-radio-control-border-selected, var(--dk-radio-control-border));
  }

  .radio-item[data-selected='true'] .radio-mark {
    opacity: 1;
  }

  .radio-item[data-invalid='true'] .radio-control {
    border-color: var(--dk-radio-control-border-invalid, var(--dk-radio-control-border));
  }

  .radio-copy {
    display: grid;
    gap: 0.18rem;
  }

  .radio-label {
    color: var(--dk-radio-item-label-color);
    font-size: var(--dk-radio-item-label-size);
    font-weight: var(--dk-radio-item-label-weight);
    line-height: 1.35;
  }

  .radio-description {
    color: var(--dk-radio-item-description-color);
    font-size: var(--dk-radio-item-description-size);
    line-height: 1.45;
  }

  .radio-meta {
    margin: 0;
  }

  .radio-error {
    color: var(--dk-radio-error-color);
    font-size: var(--dk-radio-error-size);
  }
</style>
