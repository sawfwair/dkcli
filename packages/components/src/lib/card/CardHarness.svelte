<script lang="ts">
  import Card from './Card.svelte';
</script>

<Card padding="lg" surface="raised">
  <svelte:fragment slot="media"><div>Media</div></svelte:fragment>
  <svelte:fragment slot="header"><h3>Release summary</h3></svelte:fragment>
  <p>Launch copy and rollout checklist.</p>
  <svelte:fragment slot="footer"><button type="button">Review</button></svelte:fragment>
</Card>
