<script lang="ts">
  export let label: string | undefined = undefined;
  export let description: string | undefined = undefined;
  export let error: string | undefined = undefined;
  export let required = false;
  export let disabled = false;
  export let invalid = false;
  export let fieldId: string;
  export let rootStyle = '';
  export let labelStyle = '';
  export let descriptionStyle = '';
  export let errorStyle = '';
  export let leadingStyle = '';
  export let trailingStyle = '';

  $: descriptionId = description ? `${fieldId}-description` : undefined;
  $: errorId = error ? `${fieldId}-error` : undefined;
</script>

<div
  class="dk-field-frame"
  style={rootStyle}
  data-disabled={disabled}
  data-invalid={invalid}
>
  {#if label}
    <label class="field-label" style={labelStyle} for={fieldId}>
      {label}
      {#if required}
        <span class="required-indicator" aria-hidden="true">*</span>
      {/if}
    </label>
  {/if}

  <div class="field-control-shell">
    {#if $$slots.leading}
      <span class="field-addon" style={leadingStyle}>
        <slot name="leading" />
      </span>
    {/if}

    <div class="field-control">
      <slot />
    </div>

    {#if $$slots.trailing}
      <span class="field-addon" style={trailingStyle}>
        <slot name="trailing" />
      </span>
    {/if}
  </div>

  {#if error}
    <p class="field-meta field-error" style={errorStyle} id={errorId}>{error}</p>
  {:else if description}
    <p class="field-meta field-description" style={descriptionStyle} id={descriptionId}>{description}</p>
  {/if}
</div>

<style>
  .dk-field-frame {
    display: grid;
    gap: var(--dk-field-stack-gap, 0.45rem);
  }

  .field-label {
    color: var(--dk-field-label-color, inherit);
    font-size: var(--dk-field-label-size, 0.95rem);
    font-weight: var(--dk-field-label-weight, 600);
    line-height: 1.3;
  }

  .required-indicator {
    color: currentColor;
    margin-left: 0.2rem;
    opacity: 0.75;
  }

  .field-control-shell {
    align-items: stretch;
    display: flex;
    gap: var(--dk-field-addon-gap, 0.5rem);
  }

  .field-control {
    min-width: 0;
    flex: 1;
  }

  .field-addon {
    align-items: center;
    display: inline-flex;
    justify-content: center;
  }

  .field-meta {
    color: var(--dk-field-meta-color, rgba(15, 23, 42, 0.72));
    font-size: var(--dk-field-meta-size, 0.875rem);
    line-height: 1.45;
    margin: 0;
  }

  .field-description {
    color: var(--dk-field-description-color, var(--dk-field-meta-color, rgba(15, 23, 42, 0.72)));
    font-size: var(--dk-field-description-size, var(--dk-field-meta-size, 0.875rem));
  }

  .field-error {
    color: var(--dk-field-error-color, #b42318);
    font-size: var(--dk-field-error-size, var(--dk-field-meta-size, 0.875rem));
  }
</style>
