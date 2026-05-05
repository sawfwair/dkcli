<script lang="ts">
  import type { ThemeContract } from '@dkcli/core';

  import {
    DEFAULT_BUTTON_THEME,
    createButtonRegistration,
    getButtonRecipeCase,
    serializeButtonSlotStyles
  } from './button.recipe.js';
  import { sanitizeHref } from '../shared/url.js';
  import type { ButtonContentMode, ButtonSize, ButtonVariant } from './button.spec.js';

  export let variant: ButtonVariant = 'solid';
  export let size: ButtonSize = 'md';
  export let href: string | undefined = undefined;
  export let as: 'button' | 'a' | undefined = undefined;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled = false;
  export let loading = false;
  export let iconOnly = false;
  export let ariaLabel: string | undefined = undefined;
  export let target: string | undefined = undefined;
  export let rel: string | undefined = undefined;
  export let theme: ThemeContract = DEFAULT_BUTTON_THEME;

  const defaultRegistration = createButtonRegistration(DEFAULT_BUTTON_THEME);
  let registration = defaultRegistration;
  let elementTag: 'a' | 'button' = 'button';
  let contentMode: ButtonContentMode = 'label';
  let busy = false;
  let anchorRel: string | undefined = undefined;
  let safeHref: string | undefined = undefined;
  let compiledCase = getButtonRecipeCase(defaultRegistration.recipe, {
    variant,
    size,
    content: contentMode
  });
  let slotStyles = serializeButtonSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_BUTTON_THEME.name ? defaultRegistration : createButtonRegistration(theme);

  $: if (iconOnly && !ariaLabel) {
    throw new Error('Button with iconOnly=true requires ariaLabel.');
  }

  $: safeHref = sanitizeHref(href);
  $: elementTag = safeHref || as === 'a' ? 'a' : 'button';
  $: contentMode = resolveContentMode(iconOnly, Boolean($$slots.leading), Boolean($$slots.trailing));
  $: compiledCase = getButtonRecipeCase(registration.recipe, {
    variant,
    size,
    content: contentMode
  });
  $: slotStyles = serializeButtonSlotStyles(compiledCase);
  $: busy = disabled || loading;
  $: anchorRel = target === '_blank' ? rel ?? 'noreferrer noopener' : rel;

  function resolveContentMode(
    isIconOnly: boolean,
    hasLeading: boolean,
    hasTrailing: boolean
  ): ButtonContentMode {
    if (isIconOnly) {
      return 'icon-only';
    }
    if (hasLeading && hasTrailing) {
      return 'leading-trailing';
    }
    if (hasLeading) {
      return 'leading';
    }
    if (hasTrailing) {
      return 'trailing';
    }
    return 'label';
  }

  function handleAnchorClick(event: MouseEvent): void {
    if (elementTag === 'a' && busy) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
</script>

{#if elementTag === 'a'}
  <a
    class="dk-button"
    style={slotStyles.root}
    data-variant={variant}
    data-size={size}
    data-loading={loading}
    data-disabled={busy}
    aria-busy={loading ? 'true' : undefined}
    aria-disabled={busy ? 'true' : undefined}
    aria-label={iconOnly ? ariaLabel : undefined}
    href={safeHref}
    target={target}
    rel={anchorRel}
    tabindex={busy ? -1 : undefined}
    on:click={handleAnchorClick}
  >
    {#if loading}
      <span class="slot slot-spinner" style={slotStyles.spinner}>
        <slot name="spinner">
          <span class="spinner-fallback" aria-hidden="true"></span>
        </slot>
      </span>
    {:else if iconOnly}
      <span class="slot slot-icon" style={slotStyles.icon}>
        <slot name="icon"></slot>
      </span>
    {:else if $$slots.leading}
      <span class="slot slot-leading" style={slotStyles.leading}>
        <slot name="leading"></slot>
      </span>
    {/if}

    {#if !iconOnly}
      <span class="label" style={slotStyles.label}>
        <slot></slot>
      </span>

      {#if $$slots.trailing}
        <span class="slot slot-trailing" style={slotStyles.trailing}>
          <slot name="trailing"></slot>
        </span>
      {/if}
    {/if}
  </a>
{:else}
  <button
    class="dk-button"
    style={slotStyles.root}
    data-variant={variant}
    data-size={size}
    data-loading={loading}
    data-disabled={busy}
    aria-busy={loading ? 'true' : undefined}
    aria-label={iconOnly ? ariaLabel : undefined}
    type={type}
    disabled={busy}
  >
    {#if loading}
      <span class="slot slot-spinner" style={slotStyles.spinner}>
        <slot name="spinner">
          <span class="spinner-fallback" aria-hidden="true"></span>
        </slot>
      </span>
    {:else if iconOnly}
      <span class="slot slot-icon" style={slotStyles.icon}>
        <slot name="icon"></slot>
      </span>
    {:else if $$slots.leading}
      <span class="slot slot-leading" style={slotStyles.leading}>
        <slot name="leading"></slot>
      </span>
    {/if}

    {#if !iconOnly}
      <span class="label" style={slotStyles.label}>
        <slot></slot>
      </span>

      {#if $$slots.trailing}
        <span class="slot slot-trailing" style={slotStyles.trailing}>
          <slot name="trailing"></slot>
        </span>
      {/if}
    {/if}
  </button>
{/if}

<style>
  .dk-button {
    align-items: center;
    background: var(--dk-button-bg);
    block-size: var(--dk-button-block-size);
    border: var(--dk-button-border-width) solid var(--dk-button-border);
    border-radius: var(--dk-button-radius);
    box-shadow: var(--dk-button-shadow);
    color: var(--dk-button-fg);
    cursor: var(--dk-button-cursor);
    display: inline-flex;
    gap: var(--dk-button-gap);
    inline-size: auto;
    justify-content: center;
    min-block-size: var(--dk-button-min-size);
    min-inline-size: var(--dk-button-min-size);
    opacity: var(--dk-button-opacity);
    padding-block: 0;
    padding-inline: var(--dk-button-inline-padding);
    position: relative;
    text-decoration: none;
    transform: translateY(var(--dk-button-translate-y));
    transition:
      background-color var(--dk-button-transition-duration) ease,
      border-color var(--dk-button-transition-duration) ease,
      box-shadow var(--dk-button-transition-duration) ease,
      color var(--dk-button-transition-duration) ease,
      opacity var(--dk-button-transition-duration) ease,
      transform var(--dk-button-transition-duration) ease;
    user-select: none;
    white-space: nowrap;
  }

  .dk-button:hover:not([data-disabled='true']):not([data-loading='true']) {
    background: var(--dk-button-bg-hover, var(--dk-button-bg));
    border-color: var(--dk-button-border-hover, var(--dk-button-border));
    box-shadow: var(--dk-button-shadow-hover, var(--dk-button-shadow));
    color: var(--dk-button-fg-hover, var(--dk-button-fg));
  }

  .dk-button:focus-visible {
    background: var(--dk-button-bg-focus-visible, var(--dk-button-bg-hover, var(--dk-button-bg)));
    border-color: var(--dk-button-border-focus-visible, var(--dk-button-border-hover, var(--dk-button-border)));
    box-shadow:
      0 0 0 var(--dk-button-focus-ring-width) color-mix(in srgb, var(--dk-button-focus-ring-color) 22%, transparent),
      var(--dk-button-shadow-focus-visible, var(--dk-button-shadow-hover, var(--dk-button-shadow)));
    color: var(--dk-button-fg-focus-visible, var(--dk-button-fg-hover, var(--dk-button-fg)));
    outline: none;
  }

  .dk-button:active:not([data-disabled='true']):not([data-loading='true']) {
    background: var(--dk-button-bg-pressed, var(--dk-button-bg-hover, var(--dk-button-bg)));
    border-color: var(--dk-button-border-pressed, var(--dk-button-border-hover, var(--dk-button-border)));
    box-shadow: var(--dk-button-shadow-pressed, var(--dk-button-shadow));
    color: var(--dk-button-fg-pressed, var(--dk-button-fg-hover, var(--dk-button-fg)));
    transform: translateY(var(--dk-button-translate-y-pressed, var(--dk-button-translate-y)));
  }

  .dk-button[data-disabled='true'] {
    background: var(--dk-button-bg-disabled, var(--dk-button-bg));
    border-color: var(--dk-button-border-disabled, var(--dk-button-border));
    box-shadow: var(--dk-button-shadow-disabled, var(--dk-button-shadow));
    color: var(--dk-button-fg-disabled, var(--dk-button-fg));
    cursor: var(--dk-button-cursor-disabled, var(--dk-button-cursor));
    opacity: var(--dk-button-opacity-disabled, var(--dk-button-opacity));
    transform: translateY(var(--dk-button-translate-y-disabled, 0px));
  }

  .dk-button[data-loading='true'] {
    background: var(--dk-button-bg-loading, var(--dk-button-bg));
    border-color: var(--dk-button-border-loading, var(--dk-button-border));
    box-shadow: var(--dk-button-shadow-loading, var(--dk-button-shadow));
    color: var(--dk-button-fg-loading, var(--dk-button-fg));
    cursor: var(--dk-button-cursor-loading, var(--dk-button-cursor));
  }

  .label {
    color: inherit;
    font-size: var(--dk-button-label-font-size);
    font-weight: var(--dk-button-label-font-weight);
    line-height: var(--dk-button-label-line-height);
    opacity: var(--dk-button-label-opacity);
    text-decoration: var(--dk-button-label-decoration);
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.16em;
  }

  .dk-button:hover .label {
    opacity: var(--dk-button-label-opacity-hover, var(--dk-button-label-opacity));
    text-decoration: var(--dk-button-label-decoration-hover, var(--dk-button-label-decoration));
  }

  .dk-button[data-loading='true'] .label {
    opacity: var(--dk-button-label-opacity-loading, var(--dk-button-label-opacity));
  }

  .slot {
    align-items: center;
    color: inherit;
    display: inline-flex;
    flex: none;
    justify-content: center;
  }

  .slot-leading,
  .slot-trailing,
  .slot-icon {
    block-size: var(--dk-button-icon-size);
    inline-size: var(--dk-button-icon-size);
  }

  .slot-spinner {
    block-size: var(--dk-button-spinner-size);
    inline-size: var(--dk-button-spinner-size);
  }

  .spinner-fallback {
    animation: dk-button-spin 0.9s linear infinite;
    block-size: var(--dk-button-spinner-size);
    border: 2px solid currentColor;
    border-inline-end-color: transparent;
    border-radius: 999px;
    inline-size: var(--dk-button-spinner-size);
    opacity: var(--dk-button-loading-opacity);
  }

  @keyframes dk-button-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
