<script lang="ts">
  export let size = '1rem';
  export let label: string | undefined = undefined;
</script>

<span
  class="dk-icon"
  style={`--dk-icon-size:${size};`}
  aria-hidden={label ? undefined : 'true'}
  aria-label={label}
>
  <slot />
</span>

<style>
  .dk-icon {
    align-items: center;
    display: inline-flex;
    font-size: var(--dk-icon-size);
    justify-content: center;
    line-height: 1;
    min-width: var(--dk-icon-size);
  }
</style>
