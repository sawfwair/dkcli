<script lang="ts">
  export let as: 'span' | 'p' | 'label' | 'legend' = 'span';
  export let size = '1rem';
  export let weight = '500';
  export let tone: 'default' | 'muted' | 'danger' = 'default';
</script>

<svelte:element this={as} class={`dk-text tone-${tone}`} style={`--dk-text-size:${size}; --dk-text-weight:${weight};`}>
  <slot />
</svelte:element>

<style>
  .dk-text {
    color: var(--dk-text-color, inherit);
    font-size: var(--dk-text-size);
    font-weight: var(--dk-text-weight);
    line-height: 1.45;
  }

  .tone-muted {
    color: color-mix(in srgb, currentColor 64%, transparent);
  }

  .tone-danger {
    color: #b42318;
  }
</style>
