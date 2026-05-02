<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import { DEFAULT_SWITCH_THEME, createSwitchRegistration, getSwitchRecipeCase, serializeSwitchSlotStyles } from './switch.recipe.js';
  import type { SwitchSize } from './switch.spec.js';

  let nextId = 0;
  const dispatch = createEventDispatcher<{ change: { checked: boolean } }>();

  export let checked = false;
  export let label = '';
  export let description: string | undefined = undefined;
  export let disabled = false;
  export let name: string | undefined = undefined;
  export let id: string | undefined = undefined;
  export let size: SwitchSize = 'md';
  export let theme: ThemeContract = DEFAULT_SWITCH_THEME;
  export let onChange: ((detail: { checked: boolean }) => void) | undefined = undefined;

  const defaultRegistration = createSwitchRegistration(DEFAULT_SWITCH_THEME);
  const localId = `dk-switch-${++nextId}`;

  let registration = defaultRegistration;
  let fieldId = id ?? localId;
  let compiledCase = getSwitchRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeSwitchSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_SWITCH_THEME.name ? defaultRegistration : createSwitchRegistration(theme);
  $: fieldId = id ?? localId;
  $: compiledCase = getSwitchRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeSwitchSlotStyles(compiledCase);
  $: describedBy = description ? `${fieldId}-description` : undefined;

  function handleChange(event: Event): void {
    checked = (event.currentTarget as HTMLInputElement).checked;
    onChange?.({ checked });
    dispatch('change', { checked });
  }
</script>

<div class="dk-switch" style={slotStyles.root} data-checked={checked} data-disabled={disabled}>
  <label class="switch-hit">
    <input
      class="sr-only"
      id={fieldId}
      type="checkbox"
      {name}
      bind:checked
      {disabled}
      aria-label={label}
      aria-describedby={describedBy}
      onchange={handleChange}
    />
    <span class="switch-track" style={slotStyles.track} aria-hidden="true">
      <span class="switch-thumb" style={slotStyles.thumb}></span>
    </span>
    <span class="switch-copy">
      <span class="switch-label" style={slotStyles.label}>{label}</span>
      {#if description}
        <span class="switch-description" style={slotStyles.description} id={describedBy}>{description}</span>
      {/if}
    </span>
  </label>
</div>

<style>
  .dk-switch {
    min-block-size: var(--dk-switch-hit-size);
  }

  .switch-hit {
    align-items: center;
    cursor: pointer;
    display: flex;
    gap: var(--dk-switch-gap);
    min-block-size: var(--dk-switch-hit-size);
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

  .switch-track {
    align-items: center;
    background: var(--dk-switch-track-bg);
    border-radius: var(--dk-switch-track-radius);
    display: inline-flex;
    flex: 0 0 auto;
    height: var(--dk-switch-track-height);
    padding: var(--dk-switch-thumb-offset);
    transition:
      background-color var(--dk-motion-duration) ease,
      box-shadow var(--dk-motion-duration) ease;
    width: var(--dk-switch-track-width);
  }

  .switch-hit:focus-within .switch-track {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--dk-switch-focus-ring-color) 22%, transparent);
  }

  .switch-thumb {
    background: var(--dk-switch-thumb-bg);
    block-size: var(--dk-switch-thumb-size);
    border-radius: 999px;
    inline-size: var(--dk-switch-thumb-size);
    transform: translateX(0);
    transition: transform var(--dk-motion-duration) ease;
  }

  .dk-switch[data-checked='true'] .switch-track {
    background: var(--dk-switch-track-bg-checked, var(--dk-switch-track-bg));
  }

  .dk-switch[data-checked='true'] .switch-thumb {
    transform: translateX(
      calc(var(--dk-switch-track-width) - var(--dk-switch-thumb-size) - (var(--dk-switch-thumb-offset) * 2))
    );
  }

  .switch-copy {
    display: grid;
    gap: 0.18rem;
  }

  .switch-label {
    color: var(--dk-switch-label-color);
    font-size: var(--dk-switch-label-size);
    font-weight: var(--dk-switch-label-weight);
  }

  .switch-description {
    color: var(--dk-switch-description-color);
    font-size: var(--dk-switch-description-size);
    line-height: 1.45;
  }
</style>
