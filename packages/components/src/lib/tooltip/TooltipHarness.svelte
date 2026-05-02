<script lang="ts">
  import Tooltip from './Tooltip.svelte';

  export let disabled = false;
  export let content = 'Tooltip body';
</script>

<Tooltip {content} {disabled}>
  <button type="button">Hover me</button>
</Tooltip>
