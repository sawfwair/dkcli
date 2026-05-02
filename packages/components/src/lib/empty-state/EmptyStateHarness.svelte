<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import EmptyState from './EmptyState.svelte';

  export let props: ComponentProps<typeof EmptyState> = {};
</script>

<EmptyState {...props}>
  <svelte:fragment slot="icon">◎</svelte:fragment>
  <svelte:fragment slot="actions">
    <button type="button" data-testid="empty-action">Create first item</button>
  </svelte:fragment>
</EmptyState>
