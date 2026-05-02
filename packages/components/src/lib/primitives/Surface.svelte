<script lang="ts">
  export let as: 'div' | 'section' | 'article' = 'div';
  export let tone: 'default' | 'overlay' | 'subtle' = 'default';
  export let style = '';
</script>

<svelte:element this={as} class={`dk-surface tone-${tone}`} {style}>
  <slot />
</svelte:element>

<style>
  .dk-surface {
    background: var(--dk-surface-bg, #ffffff);
    border: 1px solid var(--dk-surface-border, rgba(148, 163, 184, 0.22));
    border-radius: var(--dk-surface-radius, 1rem);
    box-shadow: var(--dk-surface-shadow, 0 18px 36px rgba(15, 23, 42, 0.08));
    color: var(--dk-surface-fg, inherit);
  }

  .tone-subtle {
    box-shadow: none;
  }

  .tone-overlay {
    box-shadow: 0 24px 48px rgba(15, 23, 42, 0.16);
  }
</style>
