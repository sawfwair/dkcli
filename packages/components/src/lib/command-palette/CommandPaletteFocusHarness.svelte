<script lang="ts">
  import CommandPalette from './CommandPalette.svelte';

  let open = $state(false);
</script>

<button type="button" onclick={() => { open = true; }}>Open commands</button>
<CommandPalette bind:open items={[{ id: 'new-file', label: 'New file' }]} />
