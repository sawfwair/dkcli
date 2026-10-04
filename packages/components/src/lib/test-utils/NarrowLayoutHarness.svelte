<script lang="ts">
  import { createProjectTheme } from '@dkcli/tokens';
  import Dialog from '../dialog/Dialog.svelte';
  import EmptyState from '../empty-state/EmptyState.svelte';
  import Accordion from '../accordion/Accordion.svelte';

  const theme = createProjectTheme({ name: 'Release reference', seed: { color: '#3366cc', ratio: 'perfect-fourth', mode: 'dark', density: 'comfortable', motion: 'snappy' }, fonts: { body: 'ABeeZee, sans-serif', display: 'ABeeZee, sans-serif', mono: 'ABeeZee, sans-serif' } });
  const text = 'Release readiness for the international workspace, including accessibility review, deployment notes, and remaining dependencies';
</script>

<main data-ready="true">
  <section data-narrow-empty style="width: 227px"><EmptyState {theme} title={text} description={text}><svelte:fragment slot="icon">◎</svelte:fragment></EmptyState></section>
  <section data-narrow-dialog style="width: 66.8125px">
    <Dialog {theme} title="Release notes">
      Review the release details, then confirm the action.
      <svelte:fragment slot="footer"><button class="footer-action" type="button">Cancel</button><button class="footer-action" type="button">Confirm</button></svelte:fragment>
    </Dialog>
  </section>
  <section data-narrow-accordion style="width: 66.8125px">
    <Accordion {theme} size="md" value="overview" items={['overview', 'timeline', 'risks'].map((value) => ({ value, label: text, description: text, content: text }))} />
  </section>
</main>

<style>
  main { display: grid; gap: 1rem; }
  section { min-inline-size: 0; }
  .footer-action { border: 1px solid; border-radius: 999px; box-sizing: border-box; font: inherit; min-block-size: 44px; min-inline-size: 44px; max-inline-size: 100%; overflow-wrap: anywhere; padding: .6rem .95rem; }
</style>
