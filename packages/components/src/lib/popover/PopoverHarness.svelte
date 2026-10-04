<script lang="ts">
  import Popover from './Popover.svelte';

  export let closeOnOutsidePress = true;
  export let focusableContent = true;
</script>

<Popover {closeOnOutsidePress}>
  {#if focusableContent}
    <button type="button">Primary action</button>
  {:else}
    <p>Popover body</p>
  {/if}
</Popover>
