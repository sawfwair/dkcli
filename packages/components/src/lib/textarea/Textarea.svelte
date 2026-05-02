<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import { FieldFrame } from '../primitives/index.js';
  import { DEFAULT_TEXTAREA_THEME, createTextareaRegistration, getTextareaRecipeCase, serializeTextareaSlotStyles } from './textarea.recipe.js';
  import type { TextareaSize } from './textarea.spec.js';

  let nextId = 0;
  const dispatch = createEventDispatcher<{ change: { value: string } }>();

  export let label: string | undefined = undefined;
  export let description: string | undefined = undefined;
  export let error: string | undefined = undefined;
  export let required = false;
  export let disabled = false;
  export let placeholder = '';
  export let name: string | undefined = undefined;
  export let id: string | undefined = undefined;
  export let value = '';
  export let rows = 4;
  export let resize: 'none' | 'vertical' | 'both' = 'vertical';
  export let size: TextareaSize = 'md';
  export let theme: ThemeContract = DEFAULT_TEXTAREA_THEME;
  export let onChange: ((detail: { value: string }) => void) | undefined = undefined;

  const defaultRegistration = createTextareaRegistration(DEFAULT_TEXTAREA_THEME);
  const localId = `dk-textarea-${++nextId}`;

  let registration = defaultRegistration;
  let fieldId = id ?? localId;
  let invalid = Boolean(error);
  let compiledCase = getTextareaRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeTextareaSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_TEXTAREA_THEME.name ? defaultRegistration : createTextareaRegistration(theme);
  $: fieldId = id ?? localId;
  $: invalid = Boolean(error);
  $: compiledCase = getTextareaRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeTextareaSlotStyles(compiledCase);
  $: describedBy = error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined;

  function handleInput(event: Event): void {
    value = (event.currentTarget as HTMLTextAreaElement).value;
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
  <div class="textarea-shell" style={slotStyles.field} data-invalid={invalid} data-disabled={disabled}>
    <textarea
      id={fieldId}
      class="textarea-input"
      {name}
      {placeholder}
      bind:value
      {rows}
      {disabled}
      aria-invalid={invalid ? 'true' : undefined}
      aria-describedby={describedBy}
      style={`--dk-textarea-resize:${resize};`}
      oninput={handleInput}
    ></textarea>
  </div>
</FieldFrame>

<style>
  .textarea-shell {
    background: var(--dk-textarea-bg);
    border: var(--dk-textarea-border-width) solid var(--dk-textarea-border);
    border-radius: var(--dk-textarea-radius);
    box-shadow: var(--dk-textarea-shadow);
    min-block-size: var(--dk-textarea-block-size);
    padding: var(--dk-textarea-block-padding) var(--dk-textarea-inline-padding);
    transition:
      background-color var(--dk-textarea-motion-duration) ease,
      border-color var(--dk-textarea-motion-duration) ease,
      box-shadow var(--dk-textarea-motion-duration) ease;
  }

  .textarea-shell:hover:not([data-disabled='true']) {
    background: var(--dk-textarea-bg-hover, var(--dk-textarea-bg));
    border-color: var(--dk-textarea-border-hover, var(--dk-textarea-border));
  }

  .textarea-shell:focus-within {
    background: var(--dk-textarea-bg-focus-visible, var(--dk-textarea-bg));
    border-color: var(--dk-textarea-border-focus-visible, var(--dk-textarea-border));
    box-shadow:
      0 0 0 3px color-mix(in srgb, var(--dk-textarea-focus-ring-color) 22%, transparent),
      var(--dk-textarea-shadow-focus-visible, var(--dk-textarea-shadow));
  }

  .textarea-shell[data-invalid='true'] {
    border-color: var(--dk-textarea-border-invalid, var(--dk-textarea-border));
  }

  .textarea-shell[data-disabled='true'] {
    background: var(--dk-textarea-bg-disabled, var(--dk-textarea-bg));
  }

  .textarea-input {
    background: transparent;
    border: 0;
    color: var(--dk-textarea-fg);
    display: block;
    font-size: var(--dk-textarea-font-size);
    inline-size: 100%;
    line-height: 1.45;
    min-block-size: calc(var(--dk-textarea-block-size) - (var(--dk-textarea-block-padding) * 2));
    outline: none;
    resize: var(--dk-textarea-resize, vertical);
  }

  .textarea-input::placeholder {
    color: var(--dk-textarea-placeholder);
  }
</style>
