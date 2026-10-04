<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import { FieldFrame } from '../primitives/index.js';
  import {
    DEFAULT_FILE_UPLOAD_THEME,
    createFileUploadRegistration,
    getFileUploadRecipeCase,
    serializeFileUploadSlotStyles
  } from './file-upload.recipe.js';
  import type { FileUploadSize } from './file-upload.spec.js';

  const uid = $props.id();

  const dispatch = createEventDispatcher<{ change: { files: File[] } }>();

  interface Props {
    label?: string | undefined;
    description?: string | undefined;
    error?: string | undefined;
    required?: boolean;
    disabled?: boolean;
    name?: string | undefined;
    id?: string | undefined;
    accept?: string | undefined;
    multiple?: boolean;
    buttonLabel?: string;
    emptyLabel?: string;
    size?: FileUploadSize;
    theme?: ThemeContract;
    onChange?: ((detail: { files: File[] }) => void) | undefined;
  }

  let {
    label = $bindable(undefined),
    description = $bindable(undefined),
    error = $bindable(undefined),
    required = $bindable(false),
    disabled = $bindable(false),
    name = $bindable(undefined),
    id = $bindable(undefined),
    accept = $bindable(undefined),
    multiple = $bindable(false),
    buttonLabel = $bindable('Choose files'),
    emptyLabel = $bindable('No files selected'),
    size = $bindable('md'),
    theme = $bindable(DEFAULT_FILE_UPLOAD_THEME),
    onChange = $bindable(undefined)
  }: Props = $props();

  const defaultRegistration = createFileUploadRegistration(DEFAULT_FILE_UPLOAD_THEME);
  const localId = `dk-file-upload-${uid}`;

  let inputEl: HTMLInputElement | null = $state(null);
  let selectedFiles: File[] = $state([]);

  let registration = $derived(theme.name === DEFAULT_FILE_UPLOAD_THEME.name
        ? defaultRegistration
        : createFileUploadRegistration(theme));
  let fieldId = $derived(id ?? localId);
  let invalid = $derived(Boolean(error));
  let compiledCase = $derived(getFileUploadRecipeCase(registration.recipe, { size }));
  let slotStyles = $derived(serializeFileUploadSlotStyles(compiledCase));
  let describedBy = $derived(error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined);

  function handleChange(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    selectedFiles = Array.from(input.files ?? []);
    onChange?.({ files: selectedFiles });
    dispatch('change', { files: selectedFiles });
  }
</script>

<FieldFrame
  {label}
  {description}
  {error}
  {required}
  {disabled}
  {invalid}
  fieldId={fieldId}
  rootStyle={slotStyles.root}
  labelStyle={`${slotStyles.label}; display: inline-flex; align-items: center; min-block-size: 44px; min-inline-size: 44px;`}
  descriptionStyle={slotStyles.description}
  errorStyle={slotStyles.error}
>
  <div class="file-upload-shell" style={slotStyles.field} data-invalid={invalid} data-disabled={disabled}>
    <input
      bind:this={inputEl}
      class="file-input"
      id={fieldId}
      type="file"
      {name}
      {accept}
      {multiple}
      {disabled}
      aria-describedby={describedBy}
      aria-invalid={invalid ? 'true' : undefined}
      onchange={handleChange}
    />

    <div class="file-upload-top">
      <button
        class="file-upload-button"
        type="button"
        style={`${slotStyles.field} ${slotStyles.button}`}
        onclick={() => inputEl?.click()}
        {disabled}
      >
        {buttonLabel}
      </button>

      <p class="file-upload-copy" style={slotStyles.copy}>
        {#if selectedFiles.length > 0}
          {selectedFiles.length} file{selectedFiles.length === 1 ? '' : 's'} selected
        {:else}
          {emptyLabel}
        {/if}
      </p>
    </div>

    {#if selectedFiles.length > 0}
      <ul class="file-upload-list" style={slotStyles.list}>
        {#each selectedFiles as file (file.name)}
          <li class="file-upload-item" style={slotStyles.item}>{file.name}</li>
        {/each}
      </ul>
    {/if}
  </div>
</FieldFrame>

<style>
  .file-upload-shell {
    background: var(--dk-file-upload-bg);
    border: 1px dashed var(--dk-file-upload-border);
    border-radius: var(--dk-file-upload-radius);
    color: var(--dk-file-upload-fg);
    display: grid;
    gap: var(--dk-file-upload-gap);
    padding: var(--dk-file-upload-padding);
  }

  .file-upload-shell[data-invalid='true'] {
    border-color: var(--dk-file-upload-border);
  }

  .file-upload-shell[data-disabled='true'] {
    opacity: 0.7;
  }

  .file-input {
    block-size: 1px;
    inline-size: 1px;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    position: absolute;
  }

  .file-upload-top {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: var(--dk-file-upload-gap);
    justify-content: space-between;
  }

  .file-upload-button {
    align-items: center;
    background: var(--dk-file-upload-button-bg);
    border: 0;
    border-radius: var(--dk-file-upload-button-radius);
    color: var(--dk-file-upload-button-fg);
    cursor: pointer;
    display: inline-flex;
    font-size: var(--dk-file-upload-button-font-size);
    font-weight: var(--dk-file-upload-button-weight);
    justify-content: center;
    min-block-size: var(--dk-file-upload-button-block-size);
    padding: 0 var(--dk-file-upload-button-inline-padding);
  }

  .file-upload-button:disabled {
    cursor: not-allowed;
  }

  .file-upload-copy {
    color: var(--dk-file-upload-copy-color);
    font-size: var(--dk-file-upload-copy-size);
    line-height: 1.45;
    margin: 0;
  }

  .file-upload-list {
    display: grid;
    gap: var(--dk-file-upload-list-gap);
    margin: 0;
    padding-left: 1rem;
  }

  .file-upload-item {
    font-size: var(--dk-file-upload-item-size);
    line-height: 1.5;
  }
</style>
