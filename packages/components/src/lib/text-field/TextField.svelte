<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import { FieldFrame } from '../primitives/index.js';
  import { DEFAULT_TEXT_FIELD_THEME, createTextFieldRegistration, getTextFieldRecipeCase, serializeTextFieldSlotStyles } from './text-field.recipe.js';
  import type { TextFieldSize } from './text-field.spec.js';

  let nextId = 0;
  const dispatch = createEventDispatcher<{ change: { value: string } }>();

  export let label: string | undefined = undefined;
  export let description: string | undefined = undefined;
  export let error: string | undefined = undefined;
  export let required = false;
  export let disabled = false;
  export let readonly = false;
  export let placeholder = '';
  export let name: string | undefined = undefined;
  export let id: string | undefined = undefined;
  export let type = 'text';
  export let value = '';
  export let size: TextFieldSize = 'md';
  export let theme: ThemeContract = DEFAULT_TEXT_FIELD_THEME;
  export let onChange: ((detail: { value: string }) => void) | undefined = undefined;

  const defaultRegistration = createTextFieldRegistration(DEFAULT_TEXT_FIELD_THEME);
  const localId = `dk-text-field-${++nextId}`;

  let registration = defaultRegistration;
  let fieldId = id ?? localId;
  let invalid = Boolean(error);
  let compiledCase = getTextFieldRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeTextFieldSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_TEXT_FIELD_THEME.name ? defaultRegistration : createTextFieldRegistration(theme);
  $: fieldId = id ?? localId;
  $: invalid = Boolean(error);
  $: compiledCase = getTextFieldRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeTextFieldSlotStyles(compiledCase);
  $: describedBy = error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined;

  function handleInput(event: Event): void {
    value = (event.currentTarget as HTMLInputElement).value;
    onChange?.({ value });
    dispatch('change', { value });
  }
</script>

<FieldFrame
  {label}
  {description}
  {error}
  {required}
  {disabled}
  {invalid}
  {fieldId}
  rootStyle={slotStyles.root}
  labelStyle={slotStyles.label}
  descriptionStyle={slotStyles.description}
  errorStyle={slotStyles.error}
>
  <div class="field-shell" style={slotStyles.field} data-invalid={invalid} data-disabled={disabled}>
    {#if $$slots.leading}
      <span class="field-addon" style={slotStyles.leading}>
        <slot name="leading" />
      </span>
    {/if}

    <input
      id={fieldId}
      class="field-input"
      {name}
      {type}
      {placeholder}
      bind:value
      {disabled}
      {readonly}
      aria-invalid={invalid ? 'true' : undefined}
      aria-describedby={describedBy}
      oninput={handleInput}
    />

    {#if $$slots.trailing}
      <span class="field-addon" style={slotStyles.trailing}>
        <slot name="trailing" />
      </span>
    {/if}
  </div>
</FieldFrame>

<style>
  .field-shell {
    align-items: center;
    background: var(--dk-text-field-bg);
    border: var(--dk-text-field-border-width) solid var(--dk-text-field-border);
    border-radius: var(--dk-text-field-radius);
    box-shadow: var(--dk-text-field-shadow);
    display: flex;
    min-block-size: var(--dk-text-field-block-size);
    padding-inline: var(--dk-text-field-inline-padding);
    transition:
      background-color var(--dk-text-field-motion-duration) ease,
      border-color var(--dk-text-field-motion-duration) ease,
      box-shadow var(--dk-text-field-motion-duration) ease;
  }

  .field-shell:hover:not([data-disabled='true']) {
    background: var(--dk-text-field-bg-hover, var(--dk-text-field-bg));
    border-color: var(--dk-text-field-border-hover, var(--dk-text-field-border));
  }

  .field-shell:focus-within {
    background: var(--dk-text-field-bg-focus-visible, var(--dk-text-field-bg));
    border-color: var(--dk-text-field-border-focus-visible, var(--dk-text-field-border));
    box-shadow:
      0 0 0 3px color-mix(in srgb, var(--dk-text-field-focus-ring-color) 22%, transparent),
      var(--dk-text-field-shadow-focus-visible, var(--dk-text-field-shadow));
  }

  .field-shell[data-invalid='true'] {
    border-color: var(--dk-text-field-border-invalid, var(--dk-text-field-border));
  }

  .field-shell[data-disabled='true'] {
    background: var(--dk-text-field-bg-disabled, var(--dk-text-field-bg));
    border-color: var(--dk-text-field-border-disabled, var(--dk-text-field-border));
  }

  .field-input {
    appearance: none;
    background: transparent;
    border: 0;
    color: var(--dk-text-field-fg);
    flex: 1;
    font-size: var(--dk-text-field-input-font-size);
    line-height: 1.2;
    min-width: 0;
    outline: none;
  }

  .field-input::placeholder {
    color: var(--dk-text-field-placeholder);
  }

  .field-input:disabled {
    color: var(--dk-text-field-fg-disabled, var(--dk-text-field-fg));
    cursor: not-allowed;
  }

  .field-addon {
    align-items: center;
    color: var(--dk-text-field-addon-color);
    display: inline-flex;
    font-size: var(--dk-text-field-addon-size);
    justify-content: center;
  }
</style>
