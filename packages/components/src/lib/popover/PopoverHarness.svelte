<script lang="ts">
  import Popover from './Popover.svelte';

  export let closeOnOutsidePress = true;
</script>

<Popover {closeOnOutsidePress}>
  <button type="button">Primary action</button>
</Popover>
