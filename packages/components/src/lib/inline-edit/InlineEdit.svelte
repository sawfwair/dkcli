<script lang="ts">
  import { createEventDispatcher, tick, untrack } from 'svelte';
  import { run } from 'svelte/legacy';
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

  const uid = $props.id();

  const dispatch = createEventDispatcher<{
    change: { value: string };
    commit: { value: string };
    cancel: { value: string };
  }>();

  interface Props {
    value?: string;
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    multiline?: boolean;
    size?: InlineEditSize;
    theme?: ThemeContract;
    onChange?: (detail: { value: string }) => void;
    onCommit?: (detail: { value: string }) => void;
    onCancel?: (detail: { value: string }) => void;
  }

  let {
    value = $bindable(''),
    label = $bindable(undefined),
    description = $bindable(undefined),
    placeholder = $bindable('Enter value'),
    disabled = $bindable(false),
    multiline = $bindable(false),
    size = $bindable('md'),
    theme = $bindable(DEFAULT_INLINE_EDIT_THEME),
    onChange = $bindable(undefined),
    onCommit = $bindable(undefined),
    onCancel = $bindable(undefined)
  }: Props = $props();

  const defaultRegistration = createInlineEditRegistration(DEFAULT_INLINE_EDIT_THEME);
  const localId = `dk-inline-edit-${uid}`;

  const fieldId = localId;

  let editState = $state(untrack(() => createInlineEditState(value)));
  let previousValue = $state(untrack(() => value));
  let displayEl: HTMLButtonElement | null = $state(null);
  let inputEl: HTMLInputElement | HTMLTextAreaElement | null = $state(null);

  let registration = $derived(
    theme.name === DEFAULT_INLINE_EDIT_THEME.name
      ? defaultRegistration
      : createInlineEditRegistration(theme)
  );
  let compiledCase = $derived(getInlineEditRecipeCase(registration.recipe, { size }));
  let slotStyles = $derived(serializeInlineEditSlotStyles(compiledCase));
  run(() => {
    if (value !== previousValue) {
      editState = createInlineEditState(value);
      previousValue = value;
    }
  });

  function startEditing(): void {
    if (disabled) {
      return;
    }
    editState = beginInlineEdit(editState);
    void tick().then(() => inputEl?.focus());
  }

  function updateDraft(nextValue: string): void {
    editState = { ...editState, draft: nextValue };
    onChange?.({ value: nextValue });
    dispatch('change', { value: nextValue });
  }

  function commitValue(restoreFocus = false): void {
    if (disabled || !editState.editing) return;
    editState = commitInlineEdit(editState, editState.draft);
    value = editState.committed;
    onCommit?.({ value: editState.committed });
    dispatch('commit', { value: editState.committed });
    if (restoreFocus) void tick().then(() => displayEl?.focus());
  }

  function cancelValue(): void {
    if (disabled || !editState.editing) return;
    editState = cancelInlineEdit(editState);
    onCancel?.({ value: editState.committed });
    dispatch('cancel', { value: editState.committed });
    void tick().then(() => displayEl?.focus());
  }

  function handleInputKeydown(event: KeyboardEvent): void {
    if (disabled) return;
    if (event.key === 'Escape') {
      cancelValue();
      event.preventDefault();
      return;
    }

    if (!multiline && event.key === 'Enter') {
      commitValue(true);
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
  {#if editState.editing}
    {#if multiline}
      <textarea
        bind:this={inputEl}
        id={fieldId}
        class="inline-field inline-field--textarea"
        style={slotStyles.field}
        bind:value={editState.draft}
        placeholder={placeholder}
        disabled={disabled}
        rows={4}
        oninput={(event) => updateDraft((event.currentTarget as HTMLTextAreaElement).value)}
        onkeydown={handleInputKeydown}
      ></textarea>
      <div class="inline-actions" style={slotStyles.actions}>
        <button type="button" {disabled} onclick={() => commitValue(true)}>Save</button>
        <button type="button" {disabled} onclick={cancelValue}>Cancel</button>
      </div>
    {:else}
      <input
        bind:this={inputEl}
        id={fieldId}
        class="inline-field"
        style={slotStyles.field}
        bind:value={editState.draft}
        placeholder={placeholder}
        disabled={disabled}
        oninput={(event) => updateDraft((event.currentTarget as HTMLInputElement).value)}
        onblur={() => commitValue()}
        onkeydown={handleInputKeydown}
      />
    {/if}
  {:else}
    <button
      type="button"
      id={fieldId}
      bind:this={displayEl}
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
      {editState.committed || placeholder}
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
