<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import { DEFAULT_CHECKBOX_THEME, createCheckboxRegistration, getCheckboxRecipeCase, serializeCheckboxSlotStyles } from './checkbox.recipe.js';
  import type { CheckboxSize } from './checkbox.spec.js';

  let nextId = 0;
  const dispatch = createEventDispatcher<{ change: { checked: boolean; indeterminate: boolean } }>();

  export let checked = false;
  export let indeterminate = false;
  export let label = '';
  export let description: string | undefined = undefined;
  export let error: string | undefined = undefined;
  export let required = false;
  export let disabled = false;
  export let name: string | undefined = undefined;
  export let id: string | undefined = undefined;
  export let size: CheckboxSize = 'md';
  export let theme: ThemeContract = DEFAULT_CHECKBOX_THEME;
  export let onChange:
    | ((detail: { checked: boolean; indeterminate: boolean }) => void)
    | undefined = undefined;

  const defaultRegistration = createCheckboxRegistration(DEFAULT_CHECKBOX_THEME);
  const localId = `dk-checkbox-${++nextId}`;

  let registration = defaultRegistration;
  let inputEl: HTMLInputElement | null = null;
  let fieldId = id ?? localId;
  let invalid = Boolean(error);
  let compiledCase = getCheckboxRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeCheckboxSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_CHECKBOX_THEME.name ? defaultRegistration : createCheckboxRegistration(theme);
  $: fieldId = id ?? localId;
  $: invalid = Boolean(error);
  $: compiledCase = getCheckboxRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeCheckboxSlotStyles(compiledCase);
  $: if (inputEl) {
    inputEl.indeterminate = indeterminate;
  }
  $: describedBy = error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined;

  function handleChange(event: Event): void {
    checked = (event.currentTarget as HTMLInputElement).checked;
    if (indeterminate) {
      indeterminate = false;
    }
    onChange?.({ checked, indeterminate });
    dispatch('change', { checked, indeterminate });
  }
</script>

<div
  class="dk-checkbox"
  style={slotStyles.root}
  data-checked={checked}
  data-indeterminate={indeterminate}
  data-disabled={disabled}
  data-invalid={invalid}
>
  <label class="checkbox-hit">
    <input
      bind:this={inputEl}
      class="sr-only"
      type="checkbox"
      {name}
      id={fieldId}
      bind:checked
      {disabled}
      aria-label={label}
      aria-checked={indeterminate ? 'mixed' : checked ? 'true' : 'false'}
      aria-describedby={describedBy}
      aria-invalid={invalid ? 'true' : undefined}
      onchange={handleChange}
    />

    <span class="checkbox-control" style={slotStyles.control} aria-hidden="true">
      <span class="checkbox-mark" style={slotStyles.mark}>
        {#if indeterminate}
          &minus;
        {:else if checked}
          &#10003;
        {/if}
      </span>
    </span>

    <span class="checkbox-copy">
      <span class="checkbox-label" style={slotStyles.label}>
        {label}
        {#if required}
          <span aria-hidden="true">*</span>
        {/if}
      </span>

      {#if error}
        <span class="checkbox-meta checkbox-error" style={slotStyles.error} id={`${fieldId}-error`}>{error}</span>
      {:else if description}
        <span class="checkbox-meta checkbox-description" style={slotStyles.description} id={`${fieldId}-description`}>{description}</span>
      {/if}
    </span>
  </label>
</div>

<style>
  .dk-checkbox {
    min-block-size: var(--dk-checkbox-hit-size);
  }

  .checkbox-hit {
    align-items: flex-start;
    cursor: pointer;
    display: flex;
    gap: var(--dk-checkbox-gap);
    min-block-size: var(--dk-checkbox-hit-size);
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

  .checkbox-control {
    align-items: center;
    background: var(--dk-checkbox-bg);
    border: var(--dk-checkbox-border-width) solid var(--dk-checkbox-border);
    border-radius: var(--dk-checkbox-radius);
    box-shadow: var(--dk-checkbox-shadow);
    display: inline-flex;
    flex: 0 0 auto;
    height: var(--dk-checkbox-size);
    justify-content: center;
    margin-top: 0.12rem;
    transition:
      background-color var(--dk-checkbox-motion-duration) ease,
      border-color var(--dk-checkbox-motion-duration) ease,
      box-shadow var(--dk-checkbox-motion-duration) ease;
    width: var(--dk-checkbox-size);
  }

  .dk-checkbox[data-checked='true'] .checkbox-control,
  .dk-checkbox[data-indeterminate='true'] .checkbox-control {
    background: var(--dk-checkbox-bg-checked, var(--dk-checkbox-bg));
    border-color: var(--dk-checkbox-border-checked, var(--dk-checkbox-border));
  }

  .dk-checkbox[data-indeterminate='true'] .checkbox-control {
    background: var(--dk-checkbox-bg-indeterminate, var(--dk-checkbox-bg-checked, var(--dk-checkbox-bg)));
    border-color: var(--dk-checkbox-border-indeterminate, var(--dk-checkbox-border-checked, var(--dk-checkbox-border)));
  }

  .dk-checkbox[data-invalid='true'] .checkbox-control {
    border-color: var(--dk-checkbox-border-invalid, var(--dk-checkbox-border));
  }

  .checkbox-hit:focus-within .checkbox-control {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--dk-checkbox-focus-ring-color) 22%, transparent);
  }

  .checkbox-mark {
    color: var(--dk-checkbox-mark-color);
    font-size: var(--dk-checkbox-mark-size);
    line-height: 1;
    opacity: 0;
  }

  .dk-checkbox[data-checked='true'] .checkbox-mark,
  .dk-checkbox[data-indeterminate='true'] .checkbox-mark {
    opacity: 1;
  }

  .checkbox-copy {
    display: grid;
    gap: var(--dk-checkbox-copy-gap);
  }

  .checkbox-label {
    color: var(--dk-checkbox-label-color);
    font-size: var(--dk-checkbox-label-size);
    font-weight: var(--dk-checkbox-label-weight);
    line-height: 1.35;
  }

  .checkbox-meta {
    line-height: 1.45;
  }

  .checkbox-description {
    color: var(--dk-checkbox-description-color);
    font-size: var(--dk-checkbox-description-size);
  }

  .checkbox-error {
    color: var(--dk-checkbox-error-color);
    font-size: var(--dk-checkbox-error-size);
  }
</style>
