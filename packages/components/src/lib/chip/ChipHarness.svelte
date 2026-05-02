<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import Chip from './Chip.svelte';

  export let props: ComponentProps<typeof Chip> = {};
</script>

<Chip {...props}>
  <svelte:fragment slot="leading">#</svelte:fragment>
</Chip>
