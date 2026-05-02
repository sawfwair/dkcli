<script lang="ts">
  export let direction: 'horizontal' | 'vertical' = 'vertical';
  export let gap = '0.75rem';
  export let align = 'stretch';
  export let justify = 'flex-start';
  export let wrap = false;
</script>

<div
  class="dk-stack"
  style={`--dk-stack-gap:${gap}; --dk-stack-align:${align}; --dk-stack-justify:${justify}; --dk-stack-direction:${direction === 'vertical' ? 'column' : 'row'}; --dk-stack-wrap:${wrap ? 'wrap' : 'nowrap'};`}
>
  <slot />
</div>

<style>
  .dk-stack {
    align-items: var(--dk-stack-align);
    display: flex;
    flex-direction: var(--dk-stack-direction);
    flex-wrap: var(--dk-stack-wrap);
    gap: var(--dk-stack-gap);
    justify-content: var(--dk-stack-justify);
  }
</style>
