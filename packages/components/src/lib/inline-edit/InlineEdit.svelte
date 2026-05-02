<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import {
    beginInlineEdit,
    cancelInlineEdit,
    commitInlineEdit,
    createInlineEditState
  } from '../internal/behavior/index.js';
  import { FieldFrame } from '../primitives/index.js';
  import {
    DEFAULT_INLINE_EDIT_THEME,
    createInlineEditRegistration,
    getInlineEditRecipeCase,
    serializeInlineEditSlotStyles
  } from './inline-edit.recipe.js';
  import type { InlineEditSize } from './inline-edit.spec.js';

  const dispatch = createEventDispatcher<{
    change: { value: string };
    commit: { value: string };
    cancel: { value: string };
  }>();

  let nextId = 0;

  export let value = '';
  export let label: string | undefined = undefined;
  export let description: string | undefined = undefined;
  export let placeholder = 'Enter value';
  export let disabled = false;
  export let multiline = false;
  export let size: InlineEditSize = 'md';
  export let theme: ThemeContract = DEFAULT_INLINE_EDIT_THEME;
  export let onChange: ((detail: { value: string }) => void) | undefined = undefined;
  export let onCommit: ((detail: { value: string }) => void) | undefined = undefined;
  export let onCancel: ((detail: { value: string }) => void) | undefined = undefined;

  const defaultRegistration = createInlineEditRegistration(DEFAULT_INLINE_EDIT_THEME);
  const localId = `dk-inline-edit-${++nextId}`;

  let registration = defaultRegistration;
  let fieldId = localId;
  let compiledCase = getInlineEditRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeInlineEditSlotStyles(compiledCase);
  let state = createInlineEditState(value);
  let previousValue = value;
  let inputEl: HTMLInputElement | HTMLTextAreaElement | null = null;

  $: registration =
    theme.name === DEFAULT_INLINE_EDIT_THEME.name
      ? defaultRegistration
      : createInlineEditRegistration(theme);
  $: compiledCase = getInlineEditRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeInlineEditSlotStyles(compiledCase);
  $: if (value !== previousValue) {
    state = createInlineEditState(value);
    previousValue = value;
  }

  function startEditing(): void {
    if (disabled) {
      return;
    }
    state = beginInlineEdit(state);
    void tick().then(() => inputEl?.focus());
  }

  function updateDraft(nextValue: string): void {
    state = { ...state, draft: nextValue };
    onChange?.({ value: nextValue });
    dispatch('change', { value: nextValue });
  }

  function commitValue(): void {
    state = commitInlineEdit(state, state.draft);
    value = state.committed;
    onCommit?.({ value: state.committed });
    dispatch('commit', { value: state.committed });
  }

  function cancelValue(): void {
    state = cancelInlineEdit(state);
    onCancel?.({ value: state.committed });
    dispatch('cancel', { value: state.committed });
  }

  function handleInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      cancelValue();
      event.preventDefault();
      return;
    }

    if (!multiline && event.key === 'Enter') {
      commitValue();
      event.preventDefault();
    }
  }
</script>

<FieldFrame
  {label}
  {description}
  fieldId={fieldId}
  rootStyle={slotStyles.root}
  labelStyle={slotStyles.label}
  descriptionStyle={slotStyles.description}
>
  {#if state.editing}
    {#if multiline}
      <textarea
        bind:this={inputEl}
        class="inline-field inline-field--textarea"
        style={slotStyles.field}
        bind:value={state.draft}
        placeholder={placeholder}
        disabled={disabled}
        rows={4}
        oninput={(event) => updateDraft((event.currentTarget as HTMLTextAreaElement).value)}
        onkeydown={handleInputKeydown}
      ></textarea>
      <div class="inline-actions" style={slotStyles.actions}>
        <button type="button" onclick={commitValue}>Save</button>
        <button type="button" onclick={cancelValue}>Cancel</button>
      </div>
    {:else}
      <input
        bind:this={inputEl}
        class="inline-field"
        style={slotStyles.field}
        bind:value={state.draft}
        placeholder={placeholder}
        disabled={disabled}
        oninput={(event) => updateDraft((event.currentTarget as HTMLInputElement).value)}
        onblur={commitValue}
        onkeydown={handleInputKeydown}
      />
    {/if}
  {:else}
    <button
      type="button"
      class="inline-display"
      style={slotStyles.display}
      disabled={disabled}
      onclick={startEditing}
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          startEditing();
          event.preventDefault();
        }
      }}
    >
      {state.committed || placeholder}
    </button>
  {/if}
</FieldFrame>

<style>
  .inline-display,
  .inline-field {
    background: var(--dk-inline-display-bg, var(--dk-inline-field-bg));
    border: 1px solid var(--dk-inline-display-border, var(--dk-inline-field-border));
    border-radius: var(--dk-inline-display-radius, var(--dk-inline-field-radius));
    color: var(--dk-inline-display-fg, var(--dk-inline-field-fg));
    inline-size: 100%;
    min-block-size: var(--dk-inline-display-block-size, var(--dk-inline-field-block-size));
    padding: 0 var(--dk-inline-display-inline-padding, var(--dk-inline-field-inline-padding));
    text-align: left;
  }

  .inline-field {
    font-size: var(--dk-inline-field-font-size);
  }

  .inline-field--textarea {
    min-block-size: 8rem;
    padding-block: 0.75rem;
    resize: vertical;
  }

  .inline-actions {
    display: inline-flex;
    gap: var(--dk-inline-actions-gap);
    margin-top: 0.5rem;
  }
</style>
