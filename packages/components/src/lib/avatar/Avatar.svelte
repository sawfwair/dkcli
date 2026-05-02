<script lang="ts">
  import type { ThemeContract } from '@dkcli/core';

  import {
    DEFAULT_AVATAR_THEME,
    createAvatarRegistration,
    getAvatarRecipeCase,
    serializeAvatarSlotStyles
  } from './avatar.recipe.js';
  import type { AvatarShape, AvatarSize } from './avatar.spec.js';

  export let name: string;
  export let src: string | undefined = undefined;
  export let alt: string | undefined = undefined;
  export let size: AvatarSize = 'md';
  export let shape: AvatarShape = 'circle';
  export let theme: ThemeContract = DEFAULT_AVATAR_THEME;

  const defaultRegistration = createAvatarRegistration(DEFAULT_AVATAR_THEME);

  let registration = defaultRegistration;
  let compiledCase = getAvatarRecipeCase(defaultRegistration.recipe, { size, shape });
  let slotStyles = serializeAvatarSlotStyles(compiledCase);

  $: registration = theme.name === DEFAULT_AVATAR_THEME.name ? defaultRegistration : createAvatarRegistration(theme);
  $: compiledCase = getAvatarRecipeCase(registration.recipe, { size, shape });
  $: slotStyles = serializeAvatarSlotStyles(compiledCase);
  $: initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('');
</script>

<span
  class="dk-avatar"
  style={slotStyles.root}
  aria-label={src ? undefined : alt ?? name}
  data-size={size}
  data-shape={shape}
>
  {#if src}
    <img class="avatar-image" style={slotStyles.image} src={src} alt={alt ?? name} />
  {:else}
    <span class="avatar-fallback" style={slotStyles.fallback}>{initials}</span>
  {/if}
</span>

<style>
  .dk-avatar {
    align-items: center;
    background: var(--dk-avatar-bg);
    border: var(--dk-avatar-ring-width) solid var(--dk-avatar-ring);
    border-radius: var(--dk-avatar-radius);
    color: var(--dk-avatar-fg);
    display: inline-flex;
    inline-size: var(--dk-avatar-size);
    justify-content: center;
    min-block-size: var(--dk-avatar-size);
    overflow: hidden;
  }

  .avatar-image {
    block-size: 100%;
    inline-size: 100%;
    object-fit: cover;
  }

  .avatar-fallback {
    color: var(--dk-avatar-fallback-color);
    font-size: var(--dk-avatar-fallback-size);
    font-weight: var(--dk-avatar-fallback-weight);
    line-height: 1;
  }
</style>
