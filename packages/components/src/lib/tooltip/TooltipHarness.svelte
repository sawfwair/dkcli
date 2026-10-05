<script lang="ts">
  import Tooltip from './Tooltip.svelte';

  export let disabled = false;
  export let content = 'Tooltip body';
  export let open = false;
  export let onOpenChange: ((detail: { open: boolean }) => void) | undefined = undefined;
</script>

<Tooltip {content} {disabled} {open} {onOpenChange}>
  <button type="button">Hover me</button>
</Tooltip>
